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
  @Prop({ required: true }) date: string;

  // Not collected by the simplified order form anymore — filled in later
  // by staff from the orders panel. All optional on purpose.
  @Prop({ default: '' }) city: string;
  @Prop({ default: '' }) address: string;
  @Prop({ default: '' }) source: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);