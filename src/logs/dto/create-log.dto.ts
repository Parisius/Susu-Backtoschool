import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateLogDto {
  @ApiProperty({ example: 'Statut commande' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'SUSU-761306 : Nouveau → Confirmé', required: false })
  @IsOptional()
  @IsString()
  details?: string;
}
