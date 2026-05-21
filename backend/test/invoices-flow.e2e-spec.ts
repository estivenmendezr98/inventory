import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import request from 'supertest';
import * as path from 'node:path';
import * as os from 'node:os';
import { PrismaClient, Prisma } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { KeycloakAdminService } from '../src/common/keycloak/keycloak-admin.service';

const shouldRun = process.env.RUN_E2E === '1' && Boolean(process.env.DATABASE_URL?.trim());
const suite = shouldRun ? describe : describe.skip;

suite('Facturación — flujo E2E (desde venta + PDF/XML)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let actorId: string;
  let saleId: string;
  let invoiceId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { email: 'admin@inventory.local' } });
    if (!user) {
      throw new Error('Ejecuta `npx prisma db seed` y define DATABASE_URL antes de RUN_E2E=1');
    }
    actorId = user.id;

    process.env.INVOICE_STORAGE_PATH = path.join(os.tmpdir(), `inv-e2e-${Date.now()}`);
    process.env.MINIO_ENDPOINT = '';
    process.env.REDIS_HOST = '';

    const product = await prisma.product.findUnique({ where: { sku: 'DEMO-001' } });
    if (!product) {
      throw new Error('Producto DEMO-001 no encontrado; ejecuta el seed.');
    }

    const sale = await prisma.sale.create({
      data: {
        number: `E2E-${Date.now()}`,
        userId: actorId,
        subtotal: new Prisma.Decimal(15000),
        discountTotal: new Prisma.Decimal(0),
        taxTotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(15000),
        status: 'COMPLETED',
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            baseQuantity: 1,
            saleUnitId: product.unitOfMeasureId,
            unitPrice: new Prisma.Decimal(15000),
            discount: new Prisma.Decimal(0),
            taxRate: new Prisma.Decimal(0),
            subtotal: new Prisma.Decimal(15000),
          },
        },
      },
    });
    saleId = sale.id;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KeycloakAdminService)
      .useValue({
        onModuleInit: async () => undefined,
        getClient: () => ({}),
        upsertRealmUserPassword: async () => ({ keycloakUserId: 'e2e-keycloak-mock' }),
        wrapKeycloakFailure: (err: unknown): never => {
          throw err instanceof Error ? err : new Error(String(err));
        },
      })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate(context: ExecutionContext): boolean {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: actorId,
            email: 'admin@inventory.local',
            firstName: 'Super',
            lastName: 'Administrador',
            role: { name: 'SUPER_ADMINISTRADOR' },
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (invoiceId) {
      await prisma.invoice.deleteMany({ where: { id: invoiceId } }).catch(() => undefined);
    }
    if (saleId) {
      await prisma.sale.deleteMany({ where: { id: saleId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
    if (app) await app.close();
  });

  it('POST /api/invoices/from-sale/:saleId crea factura con URLs de artefactos', async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .post(`/api/invoices/from-sale/${saleId}`)
      .set('Authorization', 'Bearer e2e-test')
      .expect((r) => {
        expect([200, 201]).toContain(r.status);
      });

    expect(res.body?.id).toBeTruthy();
    expect(res.body?.pdfUrl).toContain('/files/pdf');
    expect(res.body?.xmlUrl).toBeFalsy();
    invoiceId = res.body.id as string;
  });

  it('GET PDF responde 200 con contenido esperado', async () => {
    const server = app.getHttpServer();
    const pdf = await request(server)
      .get(`/api/invoices/${invoiceId}/files/pdf`)
      .set('Authorization', 'Bearer e2e-test')
      .buffer(true)
      .expect(200);

    const raw = pdf.body;
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as Uint8Array);
    expect(buf.length).toBeGreaterThan(10);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
