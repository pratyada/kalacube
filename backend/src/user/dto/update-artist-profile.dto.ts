import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ArtDimension } from '../types/user.types';

export class UpdateArtistProfileDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ArtDimension, { each: true })
  artDimensions?: ArtDimension[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediums?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  statement?: string;

  @IsOptional()
  @IsArray()
  education?: { institution: string; degree: string; year: number }[];

  @IsOptional()
  @IsArray()
  exhibitions?: {
    title: string;
    venue: string;
    year: number;
    description: string;
  }[];

  @IsOptional()
  @IsArray()
  awards?: { title: string; year: number; issuer: string }[];

  @IsOptional()
  @IsBoolean()
  availableForCommission?: boolean;

  @IsOptional()
  priceRange?: { min: number; max: number; currency: string };
}
