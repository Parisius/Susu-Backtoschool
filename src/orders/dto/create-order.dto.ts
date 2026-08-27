import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class OrderSelectionDto {
  @ApiProperty({ example: 'Serviette de bain 140×70cm' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'Bleu Roi' })
  @IsString()
  color: string;
}

class OrderItemDto {
  @ApiProperty({ example: 'Pack Essentiel' })
  @IsString()
  name: string;

  @ApiProperty({ example: 7500 })
  @IsNumber()
  price: number;

  @ApiProperty({ type: [OrderSelectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderSelectionDto)
  selections: OrderSelectionDto[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Ama Houngbédji' })
  @IsString()
  name: string;

  @ApiProperty({ example: '66181868' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'ama@exemple.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 7500 })
  @IsNumber()
  total: number;
}
