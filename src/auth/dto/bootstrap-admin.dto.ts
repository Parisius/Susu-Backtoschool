import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapAdminDto {
  @ApiProperty({ example: 'Parisius' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin@dixtri.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasseInitial123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
