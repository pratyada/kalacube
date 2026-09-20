import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ArtDimension } from '../types/user.types';

@Schema({ timestamps: true })
export class ArtistProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  // Default [] (not required): ~35% of migrated artists have no derivable
  // dimension from their legacy art styles; set during profile completion.
  @Prop({ type: [String], enum: ArtDimension, default: [] })
  artDimensions: ArtDimension[];

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [String], default: [] })
  mediums: string[];

  @Prop({ type: [String], default: [] })
  styles: string[];

  @Prop({ maxlength: 120 })
  headline: string;

  @Prop({ maxlength: 2000 })
  statement: string;

  @Prop({
    type: [
      {
        institution: String,
        degree: String,
        year: Number,
      },
    ],
    default: [],
  })
  education: { institution: string; degree: string; year: number }[];

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
  exhibitions: {
    title: string;
    venue: string;
    year: number;
    description: string;
  }[];

  @Prop({
    type: [{ title: String, year: Number, issuer: String }],
    default: [],
  })
  awards: { title: string; year: number; issuer: string }[];

  // Editorial "Journal" feature (HTML) shown on /blog/{username}. Grounded in
  // the artist's real Musée Living feature and/or their own statement + works —
  // never fabricated. `featureSource` records provenance ('musee' | 'statement').
  @Prop() feature: string;

  @Prop() featureSource: string;

  @Prop({ default: false })
  availableForCommission: boolean;

  @Prop({
    type: { min: Number, max: Number, currency: { type: String, default: 'INR' } },
  })
  priceRange: { min: number; max: number; currency: string };
}

export const ArtistProfileSchema = SchemaFactory.createForClass(ArtistProfile);
ArtistProfileSchema.index({ artDimensions: 1 });
ArtistProfileSchema.index({ skills: 1 });
