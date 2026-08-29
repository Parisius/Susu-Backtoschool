import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

// Replaces the Firestore `logs` collection. `by`/`byUid`/`role` are set
// server-side from the JWT payload, never trusted from the client — a
// staff member can log an action, but can't log it as someone else.
@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true }) action: string;
  @Prop({ default: '' }) details: string;
  @Prop({ required: true }) by: string;
  @Prop({ required: true }) byUid: string;
  @Prop({ default: '' }) role: string;
  @Prop({ required: true }) date: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
