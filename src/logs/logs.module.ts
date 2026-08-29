import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from './log.schema';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { JwtAuthModule } from '../auth/jwt-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    JwtAuthModule,
  ],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
