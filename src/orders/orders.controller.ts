import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crée une nouvelle commande (appelé par commande.js)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste toutes les commandes' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':ref')
  @ApiOperation({ summary: "Récupère une commande par sa référence (ex. SUSU-761306)" })
  findOne(@Param('ref') ref: string) {
    return this.ordersService.findByRef(ref);
  }
}
