import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ArtDimension } from '../../user/types/user.types';

/**
 * Fields collected from a new sign-up to create their Mongo profile.
 * Identity (email, sub) comes from the verified Cognito token, not the body.
 */
export class OnboardingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  // 'artist' (default) or 'user' (Guest / art enthusiast).
  @IsOptional()
  @IsIn(['artist', 'user'])
  role?: 'artist' | 'user';

  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(ArtDimension), { each: true })
  artDimensions?: ArtDimension[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  statement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
