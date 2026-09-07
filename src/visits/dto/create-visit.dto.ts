import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-...', description: 'UUID persisté en localStorage — identifie le visiteur dans le temps' })
  @IsString()
  visitorId: string;

  @ApiProperty({ example: 'f6e5d4c3-b2a1-...', description: 'UUID persisté en sessionStorage — identifie un passage sur le site' })
  @IsString()
  sessionId: string;

  @ApiProperty({ example: '/index.html' })
  @IsString()
  path: string;

  @ApiProperty({ example: 'https://www.facebook.com/', required: false })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiProperty({ example: 'instagram', required: false })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiProperty({ example: 'social', required: false })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiProperty({ example: 'rentree2026', required: false })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiProperty({ example: 'fr-FR', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 'Africa/Porto-Novo', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 390, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  screenWidth?: number;

  @ApiProperty({ example: 844, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  screenHeight?: number;
}
