import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import type { ExportAuditLogsDto } from './dto/export-audit-logs.dto';
import type { AuditLogEnriched } from './audit-presenter';

const MAX_CSV_ROWS = 25_000;
const MAX_PDF_ROWS = 800;
const MAX_RANGE_DAYS = 400;
const DELIM = ';';

export interface AuditExporterContext {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface CompanyExportInfo {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
}

interface ExportManifest {
  exportId: string;
  generatedAtBogota: string;
  periodFrom: string;
  periodTo: string;
  company: CompanyExportInfo;
  exporterLabel: string;
  exporterEmail: string;
  exporterRole: string;
  totalMatching: number;
  totalExported: number;
  truncated: boolean;
  filtersDescription: string;
}

@Injectable()
export class AuditExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async export(
    query: ExportAuditLogsDto,
    exporter: AuditExporterContext,
  ): Promise<{ filename: string; buffer: Buffer; mime: string }> {
    this.validateExportQuery(query);

    const maxRows = query.format === 'pdf' ? MAX_PDF_ROWS : MAX_CSV_ROWS;
    const { rows, total } = await this.auditService.findEnrichedForExport(query, maxRows);
    const company = await this.loadCompanyInfo();
    const exporterDb =
      exporter.id && exporter.id.length > 0
        ? await this.prisma.user.findUnique({
            where: { id: exporter.id },
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: { select: { name: true } },
            },
          })
        : null;

    const manifest: ExportManifest = {
      exportId: randomUUID(),
      generatedAtBogota: this.formatBogotaNow(),
      periodFrom: query.from!.trim(),
      periodTo: query.to!.trim(),
      company,
      exporterLabel:
        exporterDb
          ? `${exporterDb.firstName} ${exporterDb.lastName}`.trim() || exporterDb.email
          : `${exporter.firstName ?? ''} ${exporter.lastName ?? ''}`.trim() || exporter.email || 'Usuario',
      exporterEmail: exporterDb?.email ?? exporter.email ?? '—',
      exporterRole: exporterDb?.role.name?.replace(/_/g, ' ') ?? '—',
      totalMatching: total,
      totalExported: rows.length,
      truncated: total > rows.length,
      filtersDescription: this.auditService.describeFiltersPublic(query),
    };

    const slug = `${manifest.periodFrom}_${manifest.periodTo}`.replace(/[^\d-]/g, '');

    if (query.format === 'pdf') {
      const buffer = await this.buildPdf(rows, manifest);
      return {
        filename: `auditoria_legal_${slug}.pdf`,
        buffer,
        mime: 'application/pdf',
      };
    }

    const body = this.buildCsv(rows, manifest);
    const buffer = Buffer.from(`\uFEFF${body}`, 'utf-8');
    return {
      filename: `auditoria_legal_${slug}.csv`,
      buffer,
      mime: 'text/csv; charset=utf-8',
    };
  }

  private validateExportQuery(query: ExportAuditLogsDto): void {
    const from = query.from?.trim();
    const to = query.to?.trim();
    if (!from || !to) {
      throw new BadRequestException(
        'Para exportación legal debe indicar fecha desde y hasta (YYYY-MM-DD, zona Bogotá).',
      );
    }
    const start = new Date(`${from}T12:00:00`);
    const end = new Date(`${to}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas del periodo no válidas.');
    }
    if (end < start) {
      throw new BadRequestException('La fecha hasta debe ser posterior o igual a la fecha desde.');
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (days > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `El periodo no puede superar ${MAX_RANGE_DAYS} días. Acote el rango para la exportación.`,
      );
    }
  }

  private async loadCompanyInfo(): Promise<CompanyExportInfo> {
    const keys = ['company.name', 'company.tax_id', 'company.address', 'company.phone', 'company.email'];
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
    });
    const m = new Map(rows.map((r) => [r.key, r.value]));
    return {
      name: m.get('company.name')?.trim() || 'Empresa',
      taxId: m.get('company.tax_id')?.trim() || '—',
      address: m.get('company.address')?.trim() || '—',
      phone: m.get('company.phone')?.trim() || '—',
      email: m.get('company.email')?.trim() || '—',
    };
  }

  private formatBogotaNow(): string {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'long',
      timeStyle: 'medium',
    }).format(new Date());
  }

  private escCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private buildCsv(rows: AuditLogEnriched[], manifest: ExportManifest): string {
    const lines: string[] = [];
    const meta = (campo: string, valor: string) =>
      lines.push([this.escCell('MANIFIESTO'), this.escCell(campo), this.escCell(valor)].join(DELIM));

    meta('tipo_documento', 'INFORME DE TRAZABILIDAD Y AUDITORIA DEL SISTEMA');
    meta('razon_social', manifest.company.name);
    meta('nit', manifest.company.taxId);
    meta('direccion', manifest.company.address);
    meta('telefono', manifest.company.phone);
    meta('correo_empresa', manifest.company.email);
    meta('periodo_desde', manifest.periodFrom);
    meta('periodo_hasta', manifest.periodTo);
    meta('zona_horaria', 'America/Bogota (UTC-5)');
    meta('fecha_generacion', manifest.generatedAtBogota);
    meta('id_exportacion', manifest.exportId);
    meta('generado_por', manifest.exporterLabel);
    meta('correo_generador', manifest.exporterEmail);
    meta('rol_generador', manifest.exporterRole);
    meta('total_registros_coincidentes', String(manifest.totalMatching));
    meta('total_registros_exportados', String(manifest.totalExported));
    meta('exportacion_truncada', manifest.truncated ? 'SI' : 'NO');
    meta('filtros_aplicados', manifest.filtersDescription || 'ninguno');
    meta(
      'nota_legal',
      'Registro electrónico de operaciones del sistema de inventario. Conservar integridad del archivo. Referencia Ley 527 de 1999 (mensajes de datos).',
    );
    meta('sistema', 'Sistema de Inventario / POS');
    lines.push('');

    const header = [
      'numero_secuencia',
      'id_registro',
      'fecha_hora_bogota',
      'fecha_hora_utc',
      'nit_empresa',
      'razon_social',
      'modulo_codigo',
      'modulo_nombre',
      'accion_codigo',
      'accion_nombre',
      'tipo_operacion',
      'nivel_importancia',
      'titulo_resumen',
      'descripcion_narrativa',
      'detalle_cambios',
      'motivo_relevancia',
      'usuario_id',
      'usuario_nombre',
      'usuario_email',
      'usuario_rol',
      'tipo_entidad',
      'entidad_id',
      'direccion_ip',
      'resumen_tecnico',
      'datos_anteriores_json',
      'datos_nuevos_json',
    ].join(DELIM);

    lines.push(header);

    rows.forEach((r, idx) => {
      const p = r.presentation.plain;
      const row = [
        String(idx + 1),
        r.id,
        r.createdAtBogota,
        r.createdAt,
        manifest.company.taxId,
        manifest.company.name,
        r.module,
        r.presentation.moduleLabel,
        r.action,
        r.presentation.actionLabel,
        r.presentation.operation,
        r.presentation.severity,
        p.title,
        p.story,
        p.whatChanged.join(' | '),
        p.whyItMatters,
        r.user?.id ?? '',
        r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : '',
        r.user?.email ?? '',
        r.user?.roleName ?? '',
        r.entityType ?? '',
        r.entityId ?? '',
        r.ipAddress ?? '',
        r.presentation.technicalSummary,
        this.jsonCompact(r.oldData),
        this.jsonCompact(r.newData),
      ].map((c) => this.escCell(String(c ?? '')));
      lines.push(row.join(DELIM));
    });

    return lines.join('\r\n');
  }

  private jsonCompact(value: unknown): string {
    if (value == null) return '';
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  /** Evita caracteres que PDFKit no puede dibujar. */
  private pdfText(value: string): string {
    return value.replace(/\0/g, '').replace(/\r\n/g, '\n');
  }

  /** Pie de página fijo sin provocar páginas en blanco (PDFKit). */
  private drawPdfFooters(
    doc: InstanceType<typeof PDFDocument>,
    manifest: ExportManifest,
  ): void {
    const range = doc.bufferedPageRange();
    const exportRef = manifest.exportId.slice(0, 8);

    for (let i = 0; i < range.count; i++) {
      const pageIndex = range.start + i;
      doc.switchToPage(pageIndex);
      const m = doc.page.margins;
      const w = doc.page.width - m.left - m.right;
      const footerY = doc.page.height - m.bottom - 10;
      const line = this.pdfText(
        `Página ${i + 1} de ${range.count} · ${manifest.company.name} · NIT ${manifest.company.taxId} · Exp. ${exportRef}`,
      );

      doc.save();
      doc.font('Helvetica').fontSize(7).fillColor('#666666');
      doc.text(line, m.left, footerY, {
        width: w,
        align: 'center',
        lineBreak: false,
        height: 10,
        ellipsis: true,
      });
      doc.restore();
    }
  }

  private async buildPdf(rows: AuditLogEnriched[], manifest: ExportManifest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const margins = { top: 48, bottom: 56, left: 48, right: 48 };
      const doc = new PDFDocument({
        size: 'LETTER',
        margins,
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Auditoría ${manifest.periodFrom} - ${manifest.periodTo}`,
          Author: manifest.company.name,
          Subject: 'Informe de trazabilidad del sistema',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      /** Zona útil sin invadir el pie de página reservado. */
      const contentBottomY = () => doc.page.height - margins.bottom - 18;

      const ensureSpace = (neededPt: number) => {
        if (doc.y + neededPt > contentBottomY()) {
          doc.addPage();
        }
      };

      const writeCover = () => {
        doc.font('Helvetica-Bold').fontSize(14).text('INFORME DE TRAZABILIDAD Y AUDITORÍA', {
          align: 'center',
        });
        doc.font('Helvetica').fontSize(11).text('Sistema de Inventario / POS', { align: 'center' });
        doc.moveDown(0.8);

        doc.fontSize(10).font('Helvetica-Bold').text(this.pdfText(manifest.company.name));
        doc.font('Helvetica');
        doc.text(this.pdfText(`NIT: ${manifest.company.taxId}`));
        doc.text(this.pdfText(`Dirección: ${manifest.company.address}`));
        doc.text(this.pdfText(`Teléfono: ${manifest.company.phone} · Correo: ${manifest.company.email}`));
        doc.moveDown(0.6);

        doc.font('Helvetica-Bold').text('Periodo del informe', { continued: false });
        doc.font('Helvetica');
        doc.text(this.pdfText(`Desde ${manifest.periodFrom} hasta ${manifest.periodTo} (calendario Bogotá)`));
        doc.text(this.pdfText(`Generado: ${manifest.generatedAtBogota}`));
        doc.text(this.pdfText(`ID de exportación: ${manifest.exportId}`));
        doc.text(
          this.pdfText(
            `Elaborado por: ${manifest.exporterLabel} (${manifest.exporterEmail}) — Rol: ${manifest.exporterRole}`,
          ),
        );
        doc.text(
          this.pdfText(
            `Registros: ${manifest.totalExported} exportado(s) de ${manifest.totalMatching} coincidente(s)${manifest.truncated ? ' — muestra limitada por tamaño' : ''}.`,
          ),
        );
        if (manifest.filtersDescription) {
          doc.text(this.pdfText(`Filtros: ${manifest.filtersDescription}`));
        }
        doc.moveDown(0.5);

        doc.fontSize(8).fillColor('#444444').text(
          this.pdfText(
            'Documento para fines de control interno, revisión por contador o auditor. Los eventos se registran automáticamente en el sistema. Mensajes de datos y conservación: Ley 527 de 1999 (Colombia).',
          ),
          { align: 'justify' },
        );
        doc.fillColor('#000000');
        doc.moveDown(0.8);
      };

      writeCover();

      if (rows.length === 0) {
        doc.font('Helvetica').fontSize(10).text(
          this.pdfText('No hay eventos de auditoría en el periodo y filtros seleccionados.'),
        );
      }

      rows.forEach((r, i) => {
        const p = r.presentation.plain;
        ensureSpace(72);

        doc.font('Helvetica-Bold').fontSize(10).text(this.pdfText(`Evento ${i + 1} — ${p.title}`));
        doc.font('Helvetica').fontSize(9);
        doc.text(this.pdfText(`${r.createdAtBogota} · ${p.area} · ${r.presentation.actionLabel}`));
        doc.text(this.pdfText(`Responsable: ${p.who}`));
        if (r.user?.email) doc.text(this.pdfText(`Correo: ${r.user.email}`));
        if (r.entityType || r.entityId) {
          doc.text(this.pdfText(`Referencia: ${r.entityType ?? '—'} ${r.entityId ?? ''}`.trim()));
        }
        if (r.ipAddress) doc.text(this.pdfText(`IP origen: ${r.ipAddress}`));
        doc.moveDown(0.2);
        doc.text(this.pdfText(p.story), { align: 'justify' });

        if (p.whatChanged.length) {
          ensureSpace(14 * Math.min(p.whatChanged.length, 8) + 8);
          doc.moveDown(0.15).font('Helvetica-Bold').text('Cambios:', { continued: false });
          doc.font('Helvetica');
          for (const line of p.whatChanged.slice(0, 8)) {
            ensureSpace(12);
            doc.text(this.pdfText(`• ${line}`));
          }
        }

        ensureSpace(28);
        doc.moveDown(0.1).fontSize(8).fillColor('#555555');
        doc.text(this.pdfText(`Importancia: ${p.severityLabel}`));
        doc.text(this.pdfText(`ID registro: ${r.id}`));
        doc.fillColor('#000000').fontSize(9);

        const yLine = doc.y + 4;
        if (yLine < contentBottomY() - 4) {
          doc
            .strokeColor('#dddddd')
            .moveTo(margins.left, yLine)
            .lineTo(doc.page.width - margins.right, yLine)
            .stroke();
          doc.y = yLine + 10;
        }
      });

      this.drawPdfFooters(doc, manifest);
      doc.end();
    });
  }
}
