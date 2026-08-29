import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Cet email a déjà un compte.');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role,
      boutique: dto.role === 'seller' ? dto.boutique || '' : '',
      mustChangePassword: true,
    });
    return user.save();
  }

  // Used only once, by the bootstrap endpoint — always forces role: admin
  // regardless of what's requested, since this only runs when no users
  // exist yet at all.
  async createFirstAdmin(dto: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: 'admin',
      boutique: '',
      mustChangePassword: true,
    });
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Membre introuvable.');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const update: Partial<User> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.role !== undefined) update.role = dto.role;
    if (dto.boutique !== undefined) update.boutique = dto.boutique;
    // Clearing boutique when a role change moves someone away from 'seller'
    // mirrors the intent of team.js's form (boutique field only shown/sent
    // for seller), even though this is a partial update, not a full form.
    if (dto.role && dto.role !== 'seller') update.boutique = '';

    const user = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!user) throw new NotFoundException('Membre introuvable.');
    return user;
  }

  async remove(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Membre introuvable.');
  }

  // Admin/Sales Manager/Marketing action — sets a new temporary password
  // and forces a change on next login again. This is the equivalent of
  // Firebase's sendPasswordResetEmail(), but since there's no built-in
  // email-link infrastructure here yet, the new temp password is returned
  // directly to whoever triggered this, to communicate manually for now.
  async resetPassword(id: string, tempPassword: string): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    const user = await this.userModel
      .findByIdAndUpdate(id, { passwordHash, mustChangePassword: true }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('Membre introuvable.');
    return user;
  }

  async setPassword(id: string, newPassword: string): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const user = await this.userModel
      .findByIdAndUpdate(id, { passwordHash, mustChangePassword: false }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('Membre introuvable.');
    return user;
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
