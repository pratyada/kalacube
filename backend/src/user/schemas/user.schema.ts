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

  @Prop({ required: true })
  dob: Date;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
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

  @Prop({ default: 0 })
  profileCompleteness: number;

  @Prop({
    type: { google: String, facebook: String },
    default: {},
  })
  oauthProviderIds: { google: string; facebook: string };

  @Prop()
  lastLoginAt: Date;

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
