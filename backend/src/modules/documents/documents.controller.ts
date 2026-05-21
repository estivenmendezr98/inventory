import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Ip,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { createReadStream } from 'node:fs';
import type { Request } from 'express';
import type { Express } from 'express';
import { DocumentsService } from './documents.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ensureDocumentsDir } from './documents.paths';

const MAX_BYTES = 50 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
]);

type RequestWithDocId = Request & { docUploadId?: string };

function multerOptions() {
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, ensureDocumentsDir());
      },
      filename: (req, file, cb) => {
        const id = randomUUID();
        const ext = path.extname(file.originalname || '').slice(0, 32);
        (req as RequestWithDocId).docUploadId = id;
        cb(null, `${id}${ext}`);
      },
    }),
    limits: { fileSize: MAX_BYTES },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const mime = (file.mimetype || '').toLowerCase();
      if (!ALLOWED_MIMES.has(mime)) {
        cb(
          new BadRequestException(
            `Tipo de archivo no permitido (${mime}). Use PDF, imágenes, Excel, Word o texto.`,
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('documents.view')
  findAll(@Query() query: QueryDocumentsDto) {
    return this.documents.findAll(query);
  }

  @Get(':id/file')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('documents.view')
  async download(@Param('id', ParseUUIDPipe) id: string) {
    const { doc, fullPath } = await this.documents.resolveFileForDownload(id);
    const stream = createReadStream(fullPath);
    const safeName =
      doc.name.replace(/["\r\n]+/g, '_').replace(/[^\w.\- ()áéíóúñüÁÉÍÓÚÑÜ]+/g, '_').slice(0, 180) ||
      'documento';
    return new StreamableFile(stream, {
      type: doc.mimeType,
      disposition: `attachment; filename="${safeName}"`,
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('documents.upload')
  @UseInterceptors(FileInterceptor('file', multerOptions()))
  /** multipart + ValidationPipe global (forbidNonWhitelisted) puede rechazar el body si el parser envía campos extra */
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentDto,
    @CurrentUser('id') userId: string,
    @Req() req: RequestWithDocId,
  ) {
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo en el campo «file»');
    }
    const id = req.docUploadId;
    if (!id) {
      throw new BadRequestException('No se pudo generar el identificador del archivo');
    }
    return this.documents.registerAfterUpload(
      id,
      file,
      body.module,
      body.entityId,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('documents.delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Req() req: { ip?: string; headers?: Record<string, string | string[] | undefined> },
    @Ip() ip: string,
  ) {
    await this.documents.remove(id, userId, extractClientIp(req) ?? ip);
  }
}
