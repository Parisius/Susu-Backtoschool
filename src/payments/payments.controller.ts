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

  // --- Instant Payment Notification (IPN) ---
  // Configured in the PayDunya dashboard under "Intégrez notre API" —
  // MUST point here (an API route), never at a static frontend page like
  // successpay.html, which has no way to process a server-to-server POST.
  //
  // This fires independently of whether the customer's browser ever comes
  // back to successpay.html — it's PayDunya calling YOU directly, which is
  // what makes it reliable for catching payments where the customer closed
  // the tab, lost connection, or never returned after paying. It reuses
  // the exact same confirmInvoice() logic as the browser-driven /confirm
  // route, rather than trusting the IPN body's fields directly — PayDunya
  // themselves recommend re-confirming via their API instead of trusting
  // a POST body that could in theory be spoofed.
  @Post('ipn')
  @ApiOperation({
    summary:
      "Notification serveur-à-serveur PayDunya (IPN) — configurer cette URL dans le dashboard PayDunya, jamais une page HTML statique",
  })
  async handleIpn(@Body() body: any) {
    // PayDunya posts a `data` field containing a JSON string of the
    // invoice payload (not a plain JSON body) — same shape as what
    // GET /confirm receives back from PayDunya's own API.
    let payload: any = body;
    if (typeof body?.data === 'string') {
      try {
        payload = JSON.parse(body.data);
      } catch {
        payload = body;
      }
    }

    const token = payload?.invoice?.token || payload?.token;

    // Always acknowledge with 200 even if we can't find a token — returning
    // an error status here just makes PayDunya retry the same broken
    // notification on a schedule instead of moving on.
    if (!token) return { received: true };

    await this.paymentsService.confirmInvoice(token);
    return { received: true };
  }
}