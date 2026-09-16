import {
  IsEmail,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Public enquiry submission. `company` is a hidden honeypot — real users never
 * fill it; a filled value marks the request as spam (silently dropped).
 * All fields are whitelisted so the global ValidationPipe
 * (forbidNonWhitelisted) does not 400 on the honeypot.
 */
export class CreateEnquiryDto {
  @IsOptional()
  @IsString()
  artistUsername?: string;

  @IsOptional()
  @IsMongoId()
  artistId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  artworkId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  artworkTitle?: string;

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

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsIn(['enquiry', 'buy'])
  intent?: 'enquiry' | 'buy';

  // Honeypot — must stay empty. Whitelisted so validation doesn't reject it.
  @IsOptional()
  @IsString()
  company?: string;
}
