import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
class OrderSelection {
  @Prop() label: string;
  @Prop() color: string;
}

@Schema({ _id: false })
class OrderItem {
  @Prop() name: string;
  @Prop() price: number;
  @Prop({ type: [OrderSelection], default: [] }) selections: OrderSelection[];
}

// status: 'nouveau' | 'confirme' | 'preparation' | 'livre' | 'annule'
//   — same values the existing backoffice dashboard already expects.
// paymentStatus: 'en_attente' | 'completed' | 'cancelled' | 'failed'
//   — mirrors whatever PayDunya reports back.
@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true }) ref: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) phone: string;
  @Prop() email: string;
  @Prop({ type: [OrderItem], default: [] }) items: OrderItem[];
  @Prop({ required: true }) total: number;
  @Prop({ default: 'nouveau' }) status: string;
  @Prop({ default: 'en_attente' }) paymentStatus: string;
  @Prop() paydunyaToken: string;
  // 'cod' (Payer à la livraison) or 'online' (Payer maintenant) — set once
  // by the customer at checkout (see commande.js) and never changed
  // automatically afterwards, regardless of what happens with PayDunya.
  @Prop({ type: String, enum: ['cod', 'online'], default: 'online' }) paymentMode: string;
  // Populated only when paymentStatus becomes 'failed' or 'cancelled' AND
  // PayDunya actually supplied a reason. Per PayDunya's own docs this is
  // only reliably filled in for card-payment failures/cancellations — for
  // mobile money (the common case here), PayDunya generally reports just
  // the bare status with no detail, so this stays '' in that case. See
  // payments.service.ts#confirmInvoice.
  @Prop({ default: '' }) paymentFailReason: string;
  @Prop({ required: true }) date: string;

  // Not collected by the simplified order form anymore — filled in later
  // by staff from the orders panel. All optional on purpose.
  @Prop({ default: '' }) city: string;
  @Prop({ default: '' }) address: string;
  @Prop({ default: '' }) source: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);