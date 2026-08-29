import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './log.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {}

  async create(data: {
    action: string;
    details?: string;
    by: string;
    byUid: string;
    role: string;
  }): Promise<LogDocument> {
    const log = new this.logModel({
      ...data,
      details: data.details || '',
      date: new Date().toISOString(),
    });
    return log.save();
  }

  async findAll(): Promise<LogDocument[]> {
    return this.logModel.find().sort({ createdAt: -1 }).exec();
  }
}
