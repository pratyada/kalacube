import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Artwork } from '../explore/schemas/artwork.schema';
import { Order } from '../orders/schemas/order.schema';
import { UserRepository } from '../user/user.repository';
import { EmailService } from '../email/email.service';

/** Hard safety cap: never queue a bulk send larger than this in one campaign. */
const MAX_CAMPAIGN_RECIPIENTS = 1000;

type Segment = 'all' | 'active' | 'has-artwork' | `dimension:${string}`;

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Artwork.name) private artworkModel: Model<Artwork>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectConnection() private conn: Connection,
    private userRepo: UserRepository,
    private email: EmailService,
  ) {}

  async stats() {
    const users = this.userRepo.userModel;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      artists,
      artworks,
      submitted,
      artspaces,
      events,
      artstyles,
      newSignups30d,
      featured,
      artworksByStatusAgg,
      topDimensionsAgg,
    ] = await Promise.all([
      users.countDocuments(),
      users.countDocuments({ role: 'artist' }),
      this.artworkModel.countDocuments(),
      this.artworkModel.countDocuments({ status: 'submitted' }),
      this.conn.collection('artspaces').countDocuments(),
      this.conn.collection('events').countDocuments(),
      this.conn.collection('artstyles').countDocuments(),
      users.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      users.countDocuments({ isFeatured: true }),
      this.artworkModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.conn
        .collection('artistprofiles')
        .aggregate([
          { $unwind: '$artDimensions' },
          { $group: { _id: '$artDimensions', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
    ]);

    const artworksByStatus = artworksByStatusAgg.map((r: any) => ({
      status: r._id || 'unknown',
      count: r.count,
    }));
    const topDimensions = topDimensionsAgg.map((r: any) => ({
      dimension: r._id || 'unknown',
      count: r.count,
    }));

    return {
      totalUsers,
      artists,
      artworks,
      submitted,
      artspaces,
      events,
      artstyles,
      newSignups30d,
      featured,
      artworksByStatus,
      topDimensions,
    };
  }

  async listUsers(page = 1, limit = 25, search?: string, role?: string) {
    const filter: any = {};
    if (role) filter.role = role;
    if (search) {
      const rx = { $regex: search, $options: 'i' };
      filter.$or = [{ username: rx }, { email: rx }, { firstName: rx }, { lastName: rx }];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userRepo.userModel
        .find(filter, { password: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userRepo.userModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async updateUser(
    id: string,
    dto: {
      role?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      pilotSeller?: boolean;
    },
  ) {
    const set: any = {};
    if (dto.role !== undefined) set.role = dto.role;
    if (dto.isActive !== undefined) set.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) set.isFeatured = dto.isFeatured;
    if (dto.pilotSeller !== undefined) set.pilotSeller = dto.pilotSeller;
    const u = await this.userRepo.userModel.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, projection: { password: 0 } },
    );
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async listFeatured() {
    const items = await this.userRepo.userModel
      .find({ isFeatured: true }, { password: 0 })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();
    return { items, total: items.length };
  }

  async listArtworks(page = 1, limit = 25, status?: string, search?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.artworkModel
        .find(filter)
        .select('title status cost currency images artist createdAt')
        .populate('artist', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.artworkModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async updateArtwork(id: string, dto: { status?: string }) {
    const set: any = {};
    if (dto.status !== undefined) set.status = dto.status;
    const a = await this.artworkModel.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!a) throw new NotFoundException('Artwork not found');
    return a;
  }

  async deleteArtwork(id: string) {
    const r = await this.artworkModel.findByIdAndDelete(id);
    if (!r) throw new NotFoundException('Artwork not found');
    return { deleted: true };
  }

  listArtspaces() {
    return this.conn.collection('artspaces').find({}).limit(100).toArray();
  }

  listEvents() {
    return this.conn.collection('events').find({}).sort({ start: -1 }).limit(100).toArray();
  }

  /**
   * All orders for ops tracking — who's selling what, to whom, when, and the
   * payment + fulfilment state. Paged, newest first, with the artist populated.
   * Filters: paymentStatus, fulfilmentStatus, track, and a free-text search
   * across buyer name/email + item titles.
   */
  async listOrders(
    page = 1,
    limit = 25,
    filters: {
      paymentStatus?: string;
      fulfilmentStatus?: string;
      track?: string;
      search?: string;
    } = {},
  ) {
    const filter: any = {};
    if (filters.paymentStatus) filter.paymentStatus = filters.paymentStatus;
    if (filters.fulfilmentStatus) filter.fulfilmentStatus = filters.fulfilmentStatus;
    if (filters.track) filter.track = filters.track;
    if (filters.search) {
      const rx = { $regex: filters.search, $options: 'i' };
      filter.$or = [
        { 'buyer.name': rx },
        { 'buyer.email': rx },
        { 'items.title': rx },
      ];
    }
    const skip = (page - 1) * limit;
    const [items, total, paidAgg, statusAgg] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('artistId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
      this.orderModel.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, gross: { $sum: '$amount.total' }, n: { $sum: 1 } } },
      ]),
      this.orderModel.aggregate([
        { $group: { _id: '$fulfilmentStatus', n: { $sum: 1 } } },
      ]),
    ]);
    const counts: Record<string, number> = {};
    for (const g of statusAgg) counts[g._id] = g.n;
    return {
      items,
      total,
      page,
      limit,
      summary: {
        paidOrders: paidAgg[0]?.n || 0,
        grossPaid: paidAgg[0]?.gross || 0,
        byStatus: counts,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Email & Marketing
  // ---------------------------------------------------------------------------

  /**
   * Resolve the artist recipients for a marketing segment. Artists only, must
   * have a non-empty email. Segments:
   *   all              → every artist
   *   active           → active artists
   *   has-artwork      → artists with >=1 artwork
   *   dimension:<x>    → artists whose artistprofile lists art dimension <x>
   */
  private async resolveRecipients(
    segment: string,
  ): Promise<{ email: string; firstName?: string }[]> {
    const base: any = {
      role: 'artist',
      email: { $exists: true, $nin: [null, ''] },
    };

    if (segment === 'active') {
      base.isActive = true;
    } else if (segment === 'has-artwork') {
      const artistIds = await this.artworkModel.distinct('artist');
      base._id = { $in: artistIds };
    } else if (segment.startsWith('dimension:')) {
      const dim = segment.slice('dimension:'.length);
      const profiles = await this.conn
        .collection('artistprofiles')
        .find({ artDimensions: dim }, { projection: { user: 1 } })
        .toArray();
      const userIds = profiles
        .map((p: any) => p.user)
        .filter((v: any): v is Types.ObjectId => !!v);
      base._id = { $in: userIds };
    } else if (segment !== 'all') {
      throw new BadRequestException(`Unknown segment: ${segment}`);
    }

    return this.userRepo.userModel
      .find(base, { email: 1, firstName: 1 })
      .lean()
      .then((rows) =>
        rows.map((r: any) => ({ email: r.email, firstName: r.firstName })),
      );
  }

  async recipients(segment = 'all') {
    const list = await this.resolveRecipients(segment);
    return {
      segment,
      count: list.length,
      sample: list.slice(0, 10).map((r) => r.email),
    };
  }

  async createCampaign(
    dto: {
      subject?: string;
      bodyHtml?: string;
      segment?: string;
      testEmail?: string;
      confirm?: boolean;
    },
    sentBy?: string,
  ) {
    const subject = (dto.subject || '').trim();
    const bodyHtml = dto.bodyHtml || '';
    const segment = dto.segment || 'all';
    if (!subject) throw new BadRequestException('subject is required');
    if (!bodyHtml.trim()) throw new BadRequestException('bodyHtml is required');

    // --- Test / preview path: queue to exactly one address, store nothing. ---
    if (dto.testEmail) {
      const queued = await this.email.sendNewsletter(
        [{ email: dto.testEmail, firstName: 'there' }],
        { subject, bodyHtml },
      );
      return { queued, campaignId: null, test: true };
    }

    // --- Real bulk send: require explicit confirmation. ---
    if (!dto.confirm) {
      throw new BadRequestException(
        'confirm:true is required to send a real campaign',
      );
    }

    const list = await this.resolveRecipients(segment);
    if (list.length === 0) {
      throw new BadRequestException('Segment has no recipients');
    }
    if (list.length > MAX_CAMPAIGN_RECIPIENTS) {
      throw new BadRequestException(
        `Segment too large (${list.length} > ${MAX_CAMPAIGN_RECIPIENTS}). Narrow the segment.`,
      );
    }

    const queued = await this.email.sendNewsletter(list, { subject, bodyHtml });

    const doc = {
      subject,
      segment,
      recipientCount: queued,
      sentBy: sentBy || 'unknown',
      createdAt: new Date(),
    };
    const res = await this.conn.collection('campaigns').insertOne(doc);

    return { queued, campaignId: res.insertedId.toString() };
  }

  async listCampaigns() {
    const items = await this.conn
      .collection('campaigns')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return { items };
  }
}
