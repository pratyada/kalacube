import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Enquiry } from './schemas/enquiry.schema';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UserRepository } from '../user/user.repository';
import { EmailService } from '../email/email.service';

/** HTML-escape untrusted buyer input before dropping it into an email body. */
function esc(s?: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class EnquiryService {
  private readonly logger = new Logger(EnquiryService.name);

  constructor(
    @InjectModel(Enquiry.name) private enquiryModel: Model<Enquiry>,
    private readonly userRepo: UserRepository,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateEnquiryDto) {
    // Honeypot filled → treat as spam. Acknowledge success without persisting
    // so bots get no signal.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Dropped honeypot-flagged enquiry submission');
      return { ok: true };
    }

    if (!dto.artistUsername && !dto.artistId) {
      throw new BadRequestException('artistUsername or artistId is required');
    }

    const artist = dto.artistUsername
      ? await this.userRepo.findUserByUsername(dto.artistUsername)
      : await this.userRepo.findUserById(dto.artistId as string);

    if (!artist) throw new NotFoundException('Artist not found');

    const intent = dto.intent === 'buy' ? 'buy' : 'enquiry';

    const doc = await this.enquiryModel.create({
      artistId: artist._id,
      artistUsername: artist.username,
      artworkId: dto.artworkId,
      artworkTitle: dto.artworkTitle,
      buyerName: dto.buyerName.trim(),
      buyerEmail: dto.buyerEmail.trim().toLowerCase(),
      buyerPhone: dto.buyerPhone?.trim(),
      message: dto.message.trim(),
      intent,
      status: 'new',
    });

    // Fire notification + confirmation emails. EmailService swallows its own
    // errors, but guard here too so email issues never fail the submission.
    try {
      await this.notifyArtist(artist, doc);
      await this.confirmBuyer(doc);
    } catch (err) {
      this.logger.error('Enquiry email dispatch failed', err as Error);
    }

    // NEVER leak the artist's email back to the public buyer response.
    return { ok: true, id: doc._id.toString() };
  }

  private async notifyArtist(
    artist: { email: string; firstName?: string; username: string },
    doc: Enquiry,
  ) {
    if (!artist.email) return;
    const clientUrl =
      this.config.get<string>('CLIENT_URL')?.split(',')[0]?.trim() ||
      'https://kalacube.com';
    const label = doc.intent === 'buy' ? 'Buy / offer' : 'Enquiry';
    const artworkLine = doc.artworkTitle
      ? `<p><strong>Artwork:</strong> ${esc(doc.artworkTitle)}</p>`
      : '';
    const phoneLine = doc.buyerPhone
      ? `<p><strong>Phone:</strong> ${esc(doc.buyerPhone)}</p>`
      : '';

    await this.email.sendEmail({
      to: artist.email,
      replyTo: doc.buyerEmail,
      subject: `New ${label.toLowerCase()} on KalaCUBE from ${doc.buyerName}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:560px;margin:0 auto">
          <h2 style="color:#202F9A">You have a new ${esc(label.toLowerCase())}</h2>
          <p>Hi ${esc(artist.firstName || artist.username)}, someone reached out about your work on KalaCUBE.</p>
          <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin:16px 0">
            <p><strong>Intent:</strong> ${esc(label)}</p>
            ${artworkLine}
            <p><strong>Name:</strong> ${esc(doc.buyerName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(doc.buyerEmail)}">${esc(doc.buyerEmail)}</a></p>
            ${phoneLine}
            <p><strong>Message:</strong></p>
            <p style="white-space:pre-wrap">${esc(doc.message)}</p>
          </div>
          <p><a href="${clientUrl}/dashboard/enquiries" style="display:inline-block;background:#202F9A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">View in your dashboard</a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:20px">Reply directly to this email to respond to ${esc(doc.buyerName)}.</p>
        </div>`,
    });
  }

  private async confirmBuyer(doc: Enquiry) {
    const artworkLine = doc.artworkTitle
      ? `<p><strong>Artwork:</strong> ${esc(doc.artworkTitle)}</p>`
      : '';
    await this.email.sendEmail({
      to: doc.buyerEmail,
      subject: 'We received your message — KalaCUBE',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:560px;margin:0 auto">
          <h2 style="color:#202F9A">Thanks, ${esc(doc.buyerName)}!</h2>
          <p>Your message has been sent to the artist on KalaCUBE. They typically reply by email, so keep an eye on your inbox.</p>
          <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin:16px 0">
            ${artworkLine}
            <p><strong>Your message:</strong></p>
            <p style="white-space:pre-wrap">${esc(doc.message)}</p>
          </div>
          <p style="color:#6b7280;font-size:13px">If you didn't send this, you can safely ignore this email.</p>
          <p style="color:#6b7280;font-size:13px">— The KalaCUBE team</p>
        </div>`,
    });
  }

  async listMine(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return { items: [], counts: { new: 0, read: 0, closed: 0, total: 0 } };
    }
    const artistId = new Types.ObjectId(userId);
    const [items, grouped] = await Promise.all([
      this.enquiryModel.find({ artistId }).sort({ createdAt: -1 }).lean(),
      this.enquiryModel.aggregate([
        { $match: { artistId } },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]),
    ]);

    const counts = { new: 0, read: 0, closed: 0, total: 0 };
    for (const g of grouped) {
      if (g._id in counts) (counts as any)[g._id] = g.n;
      counts.total += g.n;
    }
    return { items, counts };
  }

  async updateStatus(id: string, userId: string, status: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Enquiry not found');
    const doc = await this.enquiryModel.findById(id);
    if (!doc) throw new NotFoundException('Enquiry not found');
    if (doc.artistId.toString() !== userId?.toString()) {
      throw new ForbiddenException('Not your enquiry');
    }
    doc.status = status as any;
    await doc.save();
    return { ok: true, id: doc._id.toString(), status: doc.status };
  }
}
