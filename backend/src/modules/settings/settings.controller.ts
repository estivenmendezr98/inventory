import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  Req,
  Ip,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream } from 'node:fs';
import * as path from 'node:path';
import type { Express } from 'express';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ensureBrandingDir } from './settings.paths';
import {
  COMPANY_LOGO_MAX_BYTES,
  COMPANY_LOGO_MIMES,
} from './company-logo.constants';

function logoMulterOptions() {
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, ensureBrandingDir());
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '') || '.upload';
        cb(null, `tmp-logo-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: COMPANY_LOGO_MAX_BYTES },
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const mime = (file.mimetype || '').toLowerCase();
      if (!COMPANY_LOGO_MIMES.has(mime)) {
        cb(
          new BadRequestException(
            'Formato no permitido. Use PNG, JPEG, WebP o SVG.',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('branding')
  getBranding() {
    return this.settingsService.getBrandingInfo();
  }

  @Get('company-logo')
  @Header('Cache-Control', 'public, max-age=300')
  async getCompanyLogo(): Promise<StreamableFile> {
    const { absolutePath, mimeType } = await this.settingsService.resolveLogoFile();
    const stream = createReadStream(absolutePath);
    return new StreamableFile(stream, { type: mimeType });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings.view')
  getAll() {
    return this.settingsService.getAll();
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings.update')
  update(
    @Body() dto: UpdateSettingsDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.settingsService.update(dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Post('company-logo')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings.update')
  @UseInterceptors(FileInterceptor('file', logoMulterOptions()))
  uploadLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo en el campo "file".');
    }
    return this.settingsService.uploadCompanyLogo(
      file,
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }

  @Delete('company-logo')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings.update')
  @HttpCode(HttpStatus.OK)
  deleteLogo(@Req() req: { user: { id: string } }, @Ip() ip: string) {
    return this.settingsService.deleteCompanyLogo(
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }
}
