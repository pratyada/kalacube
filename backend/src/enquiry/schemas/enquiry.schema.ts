import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnquiryIntent = 'enquiry' | 'buy';
export type EnquiryStatus = 'new' | 'read' | 'closed';

/**
 * Buyer → artist lead capture. A public buyer submits an enquiry (or buy
 * intent) against an artist (and optionally a specific artwork); the artist
 * reads/manages them from their dashboard. Collection: `enquiries`.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'enquiries' })
export class Enquiry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  artistId: Types.ObjectId;

  @Prop() artistUsername: string;

  @Prop() artworkId: string;
  @Prop() artworkTitle: string;

  @Prop({ required: true, trim: true }) buyerName: string;
  @Prop({ required: true, trim: true, lowercase: true }) buyerEmail: string;
  @Prop({ trim: true }) buyerPhone: string;

  @Prop({ required: true }) message: string;

  @Prop({ enum: ['enquiry', 'buy'], default: 'enquiry' })
  intent: EnquiryIntent;

  @Prop({ enum: ['new', 'read', 'closed'], default: 'new', index: true })
  status: EnquiryStatus;

  createdAt: Date;
}

export const EnquirySchema = SchemaFactory.createForClass(Enquiry);

// Primary access pattern: an artist's enquiries, newest first.
EnquirySchema.index({ artistId: 1, createdAt: -1 });
