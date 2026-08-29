import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion — renvoie un token JWT valable 8h' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('bootstrap-admin')
  @ApiOperation({
    summary:
      "Crée le tout premier compte admin — ne fonctionne QUE si aucun utilisateur n'existe encore. Une fois un compte créé, cette route refuse systématiquement.",
  })
  async bootstrapAdmin(@Body() dto: BootstrapAdminDto) {
    const existing = await this.usersService.count();
    if (existing > 0) {
      throw new ForbiddenException(
        'Un compte existe déjà — utilisez la page Équipe pour en ajouter un nouveau.',
      );
    }
    const user = await this.usersService.createFirstAdmin(dto);
    return this.authService.login(user);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Le membre connecté change son propre mot de passe (premier login ou volontaire)' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.usersService.setPassword(req.user.sub, dto.newPassword);
    return { success: true };
  }
}
