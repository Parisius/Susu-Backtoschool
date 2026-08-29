import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto/create-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Enregistre une action dans le journal — tout membre du staff connecté. `by`/`role` viennent du token, jamais du corps envoyé.',
  })
  create(@Req() req: any, @Body() dto: CreateLogDto) {
    return this.logsService.create({
      action: dto.action,
      details: dto.details,
      by: req.user.email,
      byUid: req.user.sub,
      role: req.user.role,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Liste le journal complet — admin uniquement (voir logs.html)' })
  findAll() {
    return this.logsService.findAll();
  }
}
