import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Same three roles team.js already grants "manage team" access to
// (add a member, reset a password) — everything else (edit role/boutique,
// remove access) stays admin-only, exactly as documented there.
const CAN_MANAGE_TEAM = ['admin', 'sales_manager', 'marketing'];

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(...CAN_MANAGE_TEAM)
  @ApiOperation({ summary: 'Créer un membre du staff (Admin, Sales Manager, Marketing)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(...CAN_MANAGE_TEAM)
  @ApiOperation({ summary: "Lister l'équipe" })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Modifier le rôle/nom/boutique — Admin uniquement' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: "Retirer l'accès d'un membre — Admin uniquement" })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles(...CAN_MANAGE_TEAM)
  @ApiOperation({
    summary:
      "Réinitialise le mot de passe d'un membre et le force à en choisir un nouveau à la prochaine connexion. Renvoie le mot de passe temporaire à communiquer manuellement (pas encore d'envoi par email).",
  })
  async resetPassword(@Param('id') id: string) {
    const tempPassword = Math.random().toString(36).slice(-10);
    await this.usersService.resetPassword(id, tempPassword);
    return { tempPassword };
  }
}
