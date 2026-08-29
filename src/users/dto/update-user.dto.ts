import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Ama Houngbédji', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'sales_manager', required: false, enum: ['admin', 'sales_manager', 'seller', 'marketing'] })
  @IsOptional()
  @IsIn(['admin', 'sales_manager', 'seller', 'marketing'])
  role?: 'admin' | 'sales_manager' | 'seller' | 'marketing';

  @ApiProperty({ example: 'Parakou', required: false })
  @IsOptional()
  @IsString()
  boutique?: string;
}
