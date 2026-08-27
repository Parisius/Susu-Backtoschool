import { BadGatewayException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  // PAYDUNYA_BASE_URL must be the sandbox host while using test_ keys, and
  // the production host once you switch to live_ keys — PayDunya rejects a
  // key/host mismatch outright (this is the "LIVE Private Key and Token
  // combination is invalid" error from earlier testing).
  private readonly baseUrl =
    process.env.PAYDUNYA_BASE_URL || 'https://app.paydunya.com/sandbox-api/v1';
  private readonly publicBaseUrl =
    process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  private readonly storeName =
    process.env.PAYDUNYA_STORE_NAME || 'SùSù — DIXTRI Textile';

  constructor(private readonly ordersService: OrdersService) {}

  private headers() {
    return {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY as string,
      'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY as string,
      'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN as string,
    };
  }

  async createInvoice(ref: string) {
    const order = await this.ordersService.findByRef(ref);

    const payload = {
      invoice: {
        total_amount: order.total,
        description: `Commande SùSù ${order.ref}`,
        customer: {
          name: order.name,
          email: order.email || '',
          phone: order.phone || '',
        },
      },
      store: {
        name: this.storeName,
        website_url: this.publicBaseUrl,
      },
      custom_data: { orderRef: order.ref },
      actions: {
        cancel_url: `${this.publicBaseUrl}/commande.html?payment_cancel=1`,
        return_url: `${this.publicBaseUrl}/successpay.html`,
      },
    };

    const res = await fetch(`${this.baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.response_code !== '00') {
      throw new BadGatewayException(
        data.response_text || 'Échec de création de la facture PayDunya.',
      );
    }

    await this.ordersService.updateByRef(order.ref, {
      paydunyaToken: data.token,
      paymentStatus: 'en_attente',
    });

    return { checkoutUrl: data.response_text, token: data.token };
  }

  async confirmInvoice(invoiceToken: string) {
    const res = await fetch(
      `${this.baseUrl}/checkout-invoice/confirm/${invoiceToken}`,
      { headers: this.headers() },
    );
    const data = await res.json();

    // PayDunya returns the real status at the root (data.status), not
    // reliably inside data.invoice.status.
    const status = data.status || data.invoice?.status || 'unknown';
    const orderRef = data.custom_data?.orderRef || null;

    if (orderRef) {
      const newStatus =
        status === 'completed'
          ? 'confirme'
          : status === 'cancelled' || status === 'failed'
          ? 'annule'
          : 'nouveau';
      await this.ordersService.updateByRef(orderRef, {
        paymentStatus: status,
        status: newStatus,
      });
    }

    return { status, orderRef, amount: data.invoice?.total_amount || null };
  }
}
