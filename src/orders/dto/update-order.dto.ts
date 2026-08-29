import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({
    example: 'confirme',
    enum: ['nouveau', 'confirme', 'preparation', 'livre', 'annule'],
    required: false,
    description: "Réservé à admin/sales_manager/seller — voir la vérification faite dans le contrôleur.",
  })
  @IsOptional()
  @IsIn(['nouveau', 'confirme', 'preparation', 'livre', 'annule'])
  status?: string;

  @ApiProperty({ example: 'Cotonou', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Quartier Fidjrossè, non loin de la pharmacie', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Instagram', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}