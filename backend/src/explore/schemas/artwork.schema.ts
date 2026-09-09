import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Maps the migrated `artworks` collection (see .secrets/migrate.js).
 * Minimal read model for the Explore gallery; extend as Module 2 grows.
 */
@Schema({ timestamps: true, collection: 'artworks' })
export class Artwork extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  artist: Types.ObjectId;

  @Prop() legacyArtistId: Types.ObjectId;
  @Prop({ index: true }) status: string;
  @Prop() title: string;
  @Prop() description: string;
  @Prop() cost: number;
  @Prop({ default: 'INR' }) currency: string;
  @Prop() medium: string;
  @Prop() material: string;
  @Prop() theme: string;
  @Prop({ type: { height: Number, width: Number } })
  dimensions: { height: number; width: number };
  @Prop() available: boolean;
  @Prop() legacyArtStyleId: [Types.ObjectId];

  // S3 key prefix; concrete image URLs get wired after the S3 sync step.
  @Prop() imagePrefix: string;

  // Public image URLs (CDN base + object key), populated by wire_images.js.
  @Prop({ type: [String], default: [] }) images: string[];
}

export const ArtworkSchema = SchemaFactory.createForClass(Artwork);
