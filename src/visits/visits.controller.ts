import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDurationDto } from './dto/update-visit-duration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('visits')
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @ApiOperation({
    summary: 'Enregistre une visite de page (appelé par visitor-tracking.js — public, pas de token)',
  })
  async create(@Body() dto: CreateVisitDto, @Req() req: any) {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const visit = await this.visitsService.create(dto, ip, userAgent);
    return { id: visit.id };
  }

  @Patch(':id/duration')
  @ApiOperation({
    summary:
      "Met à jour le temps passé sur la page (appelé via navigator.sendBeacon à la fermeture/masquage de l'onglet — public)",
  })
  async updateDuration(@Param('id') id: string, @Body() dto: UpdateVisitDurationDto) {
    await this.visitsService.updateDuration(id, dto.durationMs);
    return { received: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiQuery({ name: 'limit', required: false, example: 500 })
  @ApiOperation({ summary: 'Liste les visites récentes, la plus récente en premier (staff connecté uniquement)' })
  findRecent(@Query('days') days?: string, @Query('limit') limit?: string) {
    const d = this.clamp(parseInt(days || '7', 10), 1, 90, 7);
    const l = this.clamp(parseInt(limit || '500', 10), 1, 2000, 500);
    return this.visitsService.findRecent(d, l);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @ApiOperation({ summary: 'Statistiques agrégées de fréquentation + funnel (staff connecté uniquement)' })
  getStats(@Query('days') days?: string) {
    const d = this.clamp(parseInt(days || '30', 10), 1, 90, 30);
    return this.visitsService.getStats(d);
  }

  private clamp(n: number, min: number, max: number, fallback: number): number {
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  }

  // Caddy sits in front of the NestJS app, so req.ip alone would return
  // Caddy's own address — the real client IP arrives in X-Forwarded-For.
  // Falls back to req.ip for local/dev environments with no reverse proxy.
  private extractIp(req: any): string {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || '';
  }
}
