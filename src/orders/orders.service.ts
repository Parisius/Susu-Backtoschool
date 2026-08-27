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
}
