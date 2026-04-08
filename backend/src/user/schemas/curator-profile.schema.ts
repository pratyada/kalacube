import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ArtDimension } from '../types/user.types';

@Schema({ timestamps: true })
export class CuratorProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  expertise: string[];

  @Prop({ type: [String], enum: ArtDimension, default: [] })
  artDimensions: ArtDimension[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  affiliatedSpaces: Types.ObjectId[];

  @Prop({ maxlength: 120 })
  headline: string;

  @Prop({ maxlength: 2000 })
  bio: string;

  @Prop({
    type: [
      {
        title: String,
        venue: String,
        year: Number,
        description: String,
      },
    ],
    default: [],
  })
  curatedExhibitions: {
    title: string;
    venue: string;
    year: number;
    description: string;
  }[];

  @Prop({
    type: [{ institution: String, degree: String, year: Number }],
    default: [],
  })
  education: { institution: string; degree: string; year: number }[];
}

export const CuratorProfileSchema =
  SchemaFactory.createForClass(CuratorProfile);
CuratorProfileSchema.index({ artDimensions: 1 });
