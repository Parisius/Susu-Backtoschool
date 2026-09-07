import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateVisitDurationDto {
  @ApiProperty({ example: 15320, description: 'Temps passé sur la page, en millisecondes' })
  @IsInt()
  @Min(0)
  durationMs: number;
}
