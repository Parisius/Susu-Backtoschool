import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Visit, VisitSchema } from './visit.schema';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { JwtAuthModule } from '../auth/jwt-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]),
    JwtAuthModule, // needed by JwtAuthGuard on the staff-only routes
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
