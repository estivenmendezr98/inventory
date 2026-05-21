import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CashRegisterService } from './cash-register.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { AdminUpdateSessionDto } from './dto/admin-update-session.dto';
import { AdminUpdateMovementDto } from './dto/admin-update-movement.dto';

@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get('registers')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.open')
  listRegisters() {
    return this.cashRegisterService.listRegisters();
  }

  @Get('sessions/current')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.open')
  async getCurrent(@Req() req: { user: { id: string } }) {
    const session = await this.cashRegisterService.getCurrentSession(req.user.id);
    /** Nest no serializa `null` como JSON; el cuerpo queda vacío y el cliente falla en res.json(). */
    return { data: session };
  }

  @Post('sessions/open')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.open')
  openSession(@Body() dto: OpenSessionDto, @Req() req: { user: { id: string } }) {
    return this.cashRegisterService.openSession(dto, req.user.id);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.open')
  listSessions(@Query() query: QuerySessionsDto, @Req() req: { user: { id: string } }) {
    return this.cashRegisterService.listSessions(query, req.user.id);
  }

  /** Informe detallado (ruta dedicada; evita colisión con `sessions/:id` en algunos despliegues). */
  @Get('session-reports/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.open')
  getSessionReport(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: { id: string } }) {
    return this.cashRegisterService.getSessionReport(id, req.user.id);
  }

  @Get('sessions/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.open')
  getSession(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: { id: string } }) {
    return this.cashRegisterService.getSessionById(id, req.user.id, false);
  }

  @Patch('sessions/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.manage')
  adminUpdateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateSessionDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.cashRegisterService.adminUpdateSession(id, dto, req.user.id, ip);
  }

  @Patch('sessions/:id/movements/:movementId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.manage')
  adminUpdateMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('movementId', ParseUUIDPipe) movementId: string,
    @Body() dto: AdminUpdateMovementDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.cashRegisterService.adminUpdateMovement(id, movementId, dto, req.user.id, ip);
  }

  @Delete('sessions/:id/movements/:movementId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.manage')
  adminDeleteMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('movementId', ParseUUIDPipe) movementId: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.cashRegisterService.adminDeleteMovement(id, movementId, req.user.id, ip);
  }

  @Post('sessions/:id/close')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.close')
  closeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseSessionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.cashRegisterService.closeSession(id, dto, req.user.id);
  }

  @Post('sessions/:id/movements')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('cash_register.movement')
  addMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMovementDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.cashRegisterService.addMovement(id, dto, req.user.id);
  }
}
