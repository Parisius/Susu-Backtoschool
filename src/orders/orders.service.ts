import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // Same format the frontend used to generate client-side — kept identical
  // so existing order references stay recognizable to your team.
  private generateRef(): string {
    return 'SUSU-' + Date.now().toString().slice(-6);
  }

  async create(dto: CreateOrderDto): Promise<OrderDocument> {
    const order = new this.orderModel({
      ...dto,
      ref: this.generateRef(),
      status: 'nouveau',
      paymentStatus: 'en_attente',
      date: new Date().toISOString(),
    });
    return order.save();
  }

  async findByRef(ref: string): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({ ref }).exec();
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async updateByRef(
    ref: string,
    update: Partial<Order>,
  ): Promise<OrderDocument | null> {
    return this.orderModel
      .findOneAndUpdate({ ref }, update, { new: true })
      .exec();
  }

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  // --- Added for the backoffice orders panel ---
  // Only applies the fields actually present in `updates` — an omitted
  // field (undefined) is left untouched rather than overwritten, so the
  // controller can send a partial payload depending on the caller's role
  // (e.g. marketing sends city/address/source but never status).
  async update(id: string, updates: Partial<Order>): Promise<OrderDocument> {
    const set: Record<string, any> = {};
    if (updates.status !== undefined) set.status = updates.status;
    if (updates.city !== undefined) set.city = updates.city;
    if (updates.address !== undefined) set.address = updates.address;
    if (updates.source !== undefined) set.source = updates.source;

    const order = await this.orderModel
      .findByIdAndUpdate(id, set, { new: true })
      .exec();
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async remove(id: string): Promise<void> {
    const res = await this.orderModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Commande introuvable.');
  }
}