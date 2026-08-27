import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({
    example: 'SUSU-761306',
    description: "La référence d'une commande déjà créée via POST /orders",
  })
  @IsString()
  ref: string;
}
