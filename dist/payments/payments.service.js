"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("../orders/orders.service");
let PaymentsService = class PaymentsService {
    constructor(ordersService) {
        this.ordersService = ordersService;
        this.baseUrl = process.env.PAYDUNYA_BASE_URL || 'https://app.paydunya.com/sandbox-api/v1';
        this.publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
        this.storeName = process.env.PAYDUNYA_STORE_NAME || 'SùSù — DIXTRI Textile';
    }
    headers() {
        return {
            'Content-Type': 'application/json',
            'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
            'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
            'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN,
        };
    }
    async createInvoice(ref) {
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
            throw new common_1.BadGatewayException(data.response_text || 'Échec de création de la facture PayDunya.');
        }
        await this.ordersService.updateByRef(order.ref, {
            paydunyaToken: data.token,
            paymentStatus: 'en_attente',
        });
        return { checkoutUrl: data.response_text, token: data.token };
    }
    async confirmInvoice(invoiceToken) {
        const res = await fetch(`${this.baseUrl}/checkout-invoice/confirm/${invoiceToken}`, { headers: this.headers() });
        const data = await res.json();
        const status = data.status || data.invoice?.status || 'unknown';
        const orderRef = data.custom_data?.orderRef || null;
        if (orderRef) {
            const newStatus = status === 'completed'
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], PaymentsService);
