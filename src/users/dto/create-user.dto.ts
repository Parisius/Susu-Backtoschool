import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ama Houngbédji' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ama@dixtri.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasseTemporaire123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'seller', enum: ['admin', 'sales_manager', 'seller', 'marketing'] })
  @IsIn(['admin', 'sales_manager', 'seller', 'marketing'])
  role: 'admin' | 'sales_manager' | 'seller' | 'marketing';

  @ApiProperty({ example: 'Cotonou', required: false, description: "Uniquement pour le rôle 'seller'" })
  @IsOptional()
  @IsString()
  boutique?: string;
}
