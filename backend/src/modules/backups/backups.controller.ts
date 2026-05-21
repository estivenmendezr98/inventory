import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { createReadStream } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import { BackupsService } from './backups.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('backups')
export class BackupsController {
  constructor(private readonly backups: BackupsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('backups.create')
  list() {
    return this.backups.list();
  }

  @Post('database')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('backups.create')
  createDatabase(@Req() req: { user: { id: string } }, @Ip() ip: string) {
    return this.backups.createDatabaseBackup(
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }

  @Get('files/:filename')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('backups.create')
  async download(@Param('filename') filename: string) {
    const safe = decodeURIComponent(filename);
    const full = this.backups.resolveExistingBackupPath(safe);
    try {
      await access(full, constants.F_OK);
    } catch {
      throw new NotFoundException('Respaldo no encontrado');
    }
    return new StreamableFile(createReadStream(full), {
      type: 'application/sql',
      disposition: `attachment; filename="${safe}"`,
    });
  }

  @Delete('files/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('backups.create')
  async remove(
    @Param('filename') filename: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    await this.backups.remove(
      decodeURIComponent(filename),
      req.user.id,
      extractClientIp(req) ?? ip,
    );
  }
}
