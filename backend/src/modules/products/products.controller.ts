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
import { ProductsService } from './products.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('options/categories')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.view')
  categoryOptions() {
    return this.productsService.findCategoriesForSelect();
  }

  @Get('options/units-of-measure')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.view')
  unitsOfMeasure() {
    return this.productsService.listUnitsOfMeasure();
  }

  @Post('options/units-of-measure')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.update')
  createUnit(@Body() dto: CreateUnitOfMeasureDto) {
    return this.productsService.createUnitOfMeasure(dto);
  }

  @Patch('options/units-of-measure/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.update')
  updateUnit(@Param('id') id: string, @Body() dto: UpdateUnitOfMeasureDto) {
    return this.productsService.updateUnitOfMeasure(id, dto);
  }

  @Get('options/search')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.view')
  searchOptions(@Query('q') q?: string, @Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 20;
    return this.productsService.searchOptions(q, Number.isFinite(n) ? n : 20);
  }

  @Get('maintenance/numeric-skus')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.delete')
  listNumericSkus(@Query('max') max?: string) {
    const m = max ? parseInt(max, 10) : 740;
    return this.productsService.listNumericImportCandidates(Number.isFinite(m) ? m : 740);
  }

  @Post('maintenance/purge-numeric-skus')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.delete')
  purgeNumericSkus(
    @Query('dryRun') dryRun?: string,
    @Query('max') max?: string,
    @Req() req?: { user: { id: string } },
    @Ip() ip?: string,
  ) {
    const m = max ? parseInt(max, 10) : 740;
    return this.productsService.purgeNumericImportCandidates(
      dryRun === 'true' || dryRun === '1',
      Number.isFinite(m) ? m : 740,
      req?.user?.id,
      extractClientIp(req) ?? ip,
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.view')
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.create')
  create(
    @Body() dto: CreateProductDto,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.productsService.create(dto, req.user.id, extractClientIp(req) ?? ip);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('products.delete')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.productsService.softDelete(id, req.user.id, extractClientIp(req) ?? ip);
  }
}
