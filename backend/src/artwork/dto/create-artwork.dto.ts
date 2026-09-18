import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Fields for creating an artwork. Sent as multipart/form-data alongside the
 * image files, so numeric fields arrive as strings and are coerced via @Type.
 */
export class CreateArtworkDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  theme?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  widthCm?: number;

  @IsOptional()
  @IsBooleanString()
  available?: string;

  // 'draft' | 'submitted' — defaults to 'submitted'.
  @IsOptional()
  @IsString()
  status?: string;

  // Edit-only: JSON array (or comma-separated list) of existing image URLs to
  // KEEP. Lets an artist remove some images on PATCH. Ignored on create.
  @IsOptional()
  @IsString()
  keepImages?: string;
}
