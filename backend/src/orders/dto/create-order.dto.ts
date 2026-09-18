import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** One line the buyer wants — an artwork id + how it's fulfilled. */
export class OrderItemInput {
  @IsMongoId()
  artworkId: string;

  @IsOptional()
  @IsIn(['original', 'print'])
  kind?: 'original' | 'print';

  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;
}

/**
 * Public checkout submission. `company` is a hidden honeypot (see enquiry DTO).
 * Prices are computed server-side from the artwork — the client NEVER sets them.
 */
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  buyerName: string;

  @IsEmail()
  @MaxLength(320)
  buyerEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  buyerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shippingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shippingState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  shippingPincode?: string;

  // Honeypot — must stay empty. Whitelisted so validation doesn't reject it.
  @IsOptional()
  @IsString()
  company?: string;
}
