import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuthType, UserRole } from '../types/user.types';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, enum: AuthType })
  authType: AuthType;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ sparse: true, trim: true })
  phone: string;

  @Prop()
  countryCode: string;

  // Optional: ~73% of migrated 2021-era artists have no dob on record.
  @Prop()
  dob: Date;

  // Optional for migrated data (many legacy records lack names); collected via
  // profile completion.
  @Prop({ trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName: string;

  @Prop({ select: false })
  password: string;

  @Prop({ type: { key: String, url: String } })
  avatar: { key: string; url: string };

  @Prop({ type: { key: String, url: String } })
  coverImage: { key: string; url: string };

  @Prop({ maxlength: 500 })
  bio: string;

  @Prop({
    type: { city: String, state: String, country: String },
    default: {},
  })
  location: { city: string; state: string; country: string };

  @Prop()
  website: string;

  @Prop({
    type: {
      instagram: String,
      twitter: String,
      linkedin: String,
      facebook: String,
      youtube: String,
    },
    default: {},
  })
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
    facebook: string;
    youtube: string;
  };

  @Prop()
  emailVerifiedAt: Date;

  @Prop()
  phoneVerifiedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  // Editorially highlighted artist — surfaced on featured rails / home page.
  @Prop({ default: false, index: true })
  isFeatured: boolean;

  @Prop({ default: 0 })
  profileCompleteness: number;

  @Prop({
    type: { google: String, facebook: String },
    default: {},
  })
  oauthProviderIds: { google: string; facebook: string };

  @Prop()
  lastLoginAt: Date;

  // Preserved from legacy AWS Amplify data. Keys the artist's S3 image objects:
  //   protected/{legacyIdentityId}/artist_work/{artworkId}/...
  @Prop({ index: true })
  legacyIdentityId: string;

  // AWS Cognito `sub` for users who signed up on the new platform (the primary
  // identity link; existing/migrated users are matched by email).
  @Prop({ index: true, sparse: true })
  cognitoSub: string;

  // Legacy Google Places id from the old `location` field (kept for future
  // geocoding; the human-readable city/country live in `location`).
  @Prop()
  legacyLocationPlaceId: string;

  @Prop()
  emailVerificationToken: string;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'location.city': 1, 'location.state': 1 });
