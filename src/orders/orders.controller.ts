import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Status changes stay restricted to the three roles that actually action
// orders — matches CAN_EDIT_STATUS in the backoffice's common.js.
const CAN_EDIT_STATUS = ['admin', 'sales_manager', 'seller'];
// city/address/source are open to every staff role, including marketing —
// they don't touch order processing, just logistics/reporting info.
const CAN_EDIT_ORDER_INFO = ['admin', 'sales_manager', 'seller', 'marketing'];
const CAN_DELETE = ['admin'];

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crée une nouvelle commande (appelé par commande.js — public, pas de token)',
  })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste toutes les commandes (staff connecté uniquement)' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':ref')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère une commande par sa référence (staff connecté uniquement)' })
  findOne(@Param('ref') ref: string) {
    return this.ordersService.findByRef(ref);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CAN_EDIT_ORDER_INFO)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Modifie une commande — statut (admin/sales_manager/seller uniquement) et/ou ville/adresse/canal d'acquisition (tout le staff, y compris marketing).",
  })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderDto) {
    if (dto.status !== undefined && !CAN_EDIT_STATUS.includes(req.user.role)) {
      throw new ForbiddenException("Vous n'avez pas les droits pour modifier le statut.");
    }
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CAN_DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprime définitivement une commande (admin uniquement)' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}