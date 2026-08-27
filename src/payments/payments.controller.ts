import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-invoice')
  @ApiOperation({
    summary:
      "Crée une facture PayDunya pour une commande existante et renvoie l'URL de paiement à ouvrir",
  })
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.paymentsService.createInvoice(dto.ref);
  }

  @Get('confirm')
  @ApiOperation({
    summary:
      "Confirme le statut réel d'un paiement auprès de PayDunya (appelé par successpay.js au retour du client)",
  })
  @ApiQuery({ name: 'token', example: 'a1b2c3...', description: 'Le token renvoyé par create-invoice' })
  confirmInvoice(@Query('token') token: string) {
    if (!token) throw new BadRequestException('token requis.');
    return this.paymentsService.confirmInvoice(token);
  }
}
