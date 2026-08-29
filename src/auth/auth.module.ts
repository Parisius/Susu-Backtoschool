import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { JwtAuthModule } from './jwt-auth.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [UsersModule, JwtAuthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
