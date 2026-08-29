import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

// Mirrors the roles already defined in the Firebase-based backoffice
// (team.js / common.js) so the permission model doesn't change during
// the migration — only where it's enforced does.
export type UserRole = 'admin' | 'sales_manager' | 'seller' | 'marketing';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true }) passwordHash: string;
  @Prop({ required: true, enum: ['admin', 'sales_manager', 'seller', 'marketing'] })
  role: UserRole;
  @Prop({ default: '' }) boutique: string; // only meaningful for role === 'seller'
  // Forces a password change on first login — same mechanic as the
  // Firebase version's mustChangePassword flag on the staff document.
  @Prop({ default: true }) mustChangePassword: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
