import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { extractClientIp } from '../../common/utils/request-ip.util';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('options/flat')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('categories.view')
  flatOptions() {
    return this.categoriesService.findActiveFlat();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('categories.view')
  findAll(@Query() query: QueryCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('categories.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('categories.create')
  create(
    @Body() dto: CreateCategoryDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.categoriesService.create(dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('categories.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.categoriesService.update(id, dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('categories.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.softDelete(id);
  }
}
