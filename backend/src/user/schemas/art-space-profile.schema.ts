import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ArtDimension, SpaceType } from '../types/user.types';

@Schema({ timestamps: true })
export class ArtSpaceProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  spaceName: string;

  @Prop({ enum: SpaceType, default: SpaceType.GALLERY })
  spaceType: SpaceType;

  @Prop({ maxlength: 2000 })
  description: string;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      postalCode: String,
    },
    default: {},
  })
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  coordinates: { type: string; coordinates: number[] };

  @Prop()
  capacity: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: [String], enum: ArtDimension, default: [] })
  artDimensions: ArtDimension[];

  @Prop({
    type: [
      {
        day: Number,
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  openingHours: {
    day: number;
    open: string;
    close: string;
    closed: boolean;
  }[];

  @Prop()
  contactEmail: string;

  @Prop()
  contactPhone: string;

  @Prop({
    type: [{ key: String, url: String, caption: String }],
    default: [],
  })
  images: { key: string; url: string; caption: string }[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  curators: Types.ObjectId[];
}

export const ArtSpaceProfileSchema =
  SchemaFactory.createForClass(ArtSpaceProfile);
ArtSpaceProfileSchema.index({ coordinates: '2dsphere' });
ArtSpaceProfileSchema.index({ spaceType: 1 });
ArtSpaceProfileSchema.index({ artDimensions: 1 });
