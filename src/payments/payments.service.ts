import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

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

  // Re-check pending payments no sooner than this — PayDunya's own
  // checkout page shows a 30 min session countdown, so anything younger
  // is very likely still legitimately in progress.
  private readonly RECHECK_AFTER_MS = 15 * 60 * 1000;
  // Past this age, stop asking PayDunya and mark it dead ourselves —
  // otherwise a truly abandoned checkout (customer closed the tab, no
  // IPN ever fires because nothing ever happened) sits as "pending" forever.
  private readonly GIVE_UP_AFTER_MS = 60 * 60 * 1000;

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

    let order: any = null;
    if (orderRef) {
      const newStatus =
        status === 'completed'
          ? 'confirme'
          : status === 'cancelled' || status === 'failed'
          ? 'annule'
          : 'nouveau';
      order = await this.ordersService.updateByRef(orderRef, {
        paymentStatus: status,
        status: newStatus,
      });
    }

    return {
      status,
      orderRef,
      amount: data.invoice?.total_amount || null,
      // Included so successpay.js can send the confirmation email only
      // once payment is actually confirmed, without a second (auth'd)
      // call to fetch order details it otherwise has no access to.
      order: order
        ? {
            ref: order.ref,
            name: order.name,
            phone: order.phone,
            email: order.email,
            items: order.items,
            total: order.total,
            date: order.date,
          }
        : null,
    };
  }

  // --- Reconciliation: catches payments no browser ever came back to
  // confirm, and no IPN ever reported (e.g. the customer just closed the
  // tab mid-checkout). Runs every 10 minutes. Requires ScheduleModule.forRoot()
  // to be imported once in AppModule for @Cron to actually fire — see setup
  // note below.
  @Cron('*/10 * * * *')
  async reconcilePendingPayments() {
    const stale = await this.ordersService.findStalePendingPayments(this.RECHECK_AFTER_MS);
    if (stale.length === 0) return;

    this.logger.log(`Réconciliation PayDunya : ${stale.length} commande(s) en attente à revérifier.`);

    for (const order of stale) {
      let stillUnresolved = true;
      try {
        const result = await this.confirmInvoice(order.paydunyaToken);
        // confirmInvoice() already wrote the real outcome to the order if
        // PayDunya reported one — nothing more to do for this order.
        if (result.status !== 'en_attente' && result.status !== 'pending' && result.status !== 'unknown') {
          stillUnresolved = false;
        }
      } catch (err) {
        this.logger.warn(`Échec vérification PayDunya pour ${order.ref} : ${err.message}`);
        // Treat an unreachable/invalid check the same as "still unresolved"
        // — fall through to the age check below rather than looping forever
        // on a token PayDunya no longer recognizes.
      }

      if (!stillUnresolved) continue;

      const ageMs = Date.now() - (order as any).createdAt.getTime();
      if (ageMs > this.GIVE_UP_AFTER_MS) {
        await this.ordersService.updateByRef(order.ref, {
          paymentStatus: 'expire',
          status: 'annule',
        });
        this.logger.log(`${order.ref} marquée paiement expiré après ${Math.round(ageMs / 60000)} min sans résolution.`);
      }
    }
  }
}