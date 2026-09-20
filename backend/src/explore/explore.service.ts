import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Artwork } from './schemas/artwork.schema';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class ExploreService {
  constructor(
    @InjectModel(Artwork.name) private artworkModel: Model<Artwork>,
    @InjectConnection() private conn: Connection,
    private readonly userRepo: UserRepository,
  ) {}

  /**
   * The artwork category taxonomy (domain → category → specialist) with live
   * submitted-artwork counts, derived from the `artstyles` collection that each
   * artwork references via `legacyArtStyleId`.
   */
  async getCategories() {
    const rows = await this.artworkModel.aggregate([
      { $match: { status: 'submitted', legacyArtStyleId: { $exists: true, $ne: [] } } },
      { $unwind: '$legacyArtStyleId' },
      {
        $lookup: {
          from: 'artstyles',
          localField: 'legacyArtStyleId',
          foreignField: '_id',
          as: 's',
        },
      },
      { $unwind: '$s' },
      {
        $group: {
          _id: {
            domain: { $trim: { input: '$s.domain' } },
            category: { $trim: { input: '$s.category' } },
            specialist: { $trim: { input: '$s.specialist' } },
          },
          n: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { domain: '$_id.domain', category: '$_id.category' },
          count: { $sum: '$n' },
          specialists: { $push: { name: '$_id.specialist', count: '$n' } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return rows
      .filter((r) => r._id.category)
      .map((r) => ({
        domain: r._id.domain,
        category: r._id.category,
        count: r.count,
        specialists: (r.specialists as { name: string; count: number }[])
          .filter((s) => s.name)
          .sort((a, b) => b.count - a.count),
      }));
  }

  /** Resolve artstyle _ids matching a domain / category / specialist (trim-tolerant). */
  private async styleIdsFor(
    domain?: string,
    category?: string,
    specialist?: string,
  ) {
    const exact = (v: string) => ({
      $regex: `^\\s*${escapeRegex(v)}\\s*$`,
      $options: 'i',
    });
    const and: Record<string, any>[] = [];
    if (domain) and.push({ domain: exact(domain) });
    if (category) and.push({ category: exact(category) });
    if (specialist) and.push({ specialist: exact(specialist) });
    const styles = await this.conn
      .collection('artstyles')
      .find(and.length ? { $and: and } : {})
      .project({ _id: 1 })
      .toArray();
    return styles.map((s) => s._id);
  }

  async listArtworks(
    page = 1,
    limit = 24,
    domain?: string,
    category?: string,
    specialist?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const match: Record<string, any> = { status: 'submitted' };
    if (search) match.title = { $regex: escapeRegex(search), $options: 'i' };

    // Art type / category / sub-category all live on the artstyle the artwork
    // references (legacyArtStyleId).
    if (domain || category || specialist) {
      const styleIds = await this.styleIdsFor(domain, category, specialist);
      // No matching styles → guarantee an empty result set.
      match.legacyArtStyleId = { $in: styleIds.length ? styleIds : [null] };
    }

    const base = [{ $match: match }];

    const [items, countRes] = await Promise.all([
      this.artworkModel.aggregate([
        ...base,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'artist',
            foreignField: '_id',
            as: '_artist',
          },
        },
        {
          $addFields: {
            artist: {
              $let: {
                vars: { a: { $arrayElemAt: ['$_artist', 0] } },
                in: {
                  username: '$$a.username',
                  firstName: '$$a.firstName',
                  lastName: '$$a.lastName',
                },
              },
            },
          },
        },
        {
          $project: {
            title: 1,
            cost: 1,
            currency: 1,
            medium: 1,
            theme: 1,
            imagePrefix: 1,
            images: 1,
            artist: 1,
            createdAt: 1,
          },
        },
      ]),
      this.artworkModel.aggregate([...base, { $count: 'n' }]),
    ]);

    return { items, total: countRes[0]?.n || 0, page, limit };
  }

  async listArtists(
    page = 1,
    limit = 24,
    search?: string,
    domain?: string,
    category?: string,
    specialist?: string,
  ) {
    const skip = (page - 1) * limit;
    const match: any = { role: 'artist', isActive: true };
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      match.$or = [{ username: rx }, { firstName: rx }, { lastName: rx }];
    }

    // Filter by the art-type/category/style ladder: an artist qualifies if they
    // have submitted artworks referencing a matching artstyle.
    if (domain || category || specialist) {
      const styleIds = await this.styleIdsFor(domain, category, specialist);
      const artistIds = await this.artworkModel.distinct('artist', {
        status: 'submitted',
        legacyArtStyleId: { $in: styleIds.length ? styleIds : [null] },
      });
      match._id = { $in: artistIds };
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'artistprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      {
        $lookup: {
          from: 'artworks',
          let: { uid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$artist', '$$uid'] },
                status: 'submitted',
              },
            },
            { $count: 'n' },
          ],
          as: 'awCount',
        },
      },
      {
        $addFields: {
          headline: { $arrayElemAt: ['$profile.headline', 0] },
          artDimensions: { $arrayElemAt: ['$profile.artDimensions', 0] },
          artworkCount: {
            $ifNull: [{ $arrayElemAt: ['$awCount.n', 0] }, 0],
          },
        },
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1,
          location: 1,
          headline: 1,
          artDimensions: 1,
          artworkCount: 1,
        },
      },
      { $sort: { artworkCount: -1, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    // The filter now lives entirely in `match`, so the count is a plain query.
    const [data, total] = await Promise.all([
      this.userRepo.userModel.aggregate(pipeline as any),
      this.userRepo.userModel.countDocuments(match),
    ]);
    return { items: data, total, page, limit };
  }

  /**
   * Topical blog posts (art-style & category guides) from the `blogposts`
   * collection — list view (no HTML body), newest first.
   */
  async listPosts() {
    const items = await this.conn
      .collection('blogposts')
      .find({ published: { $ne: false } })
      .project({ html: 0 })
      .sort({ publishedAt: -1 })
      .toArray();
    return { items };
  }

  /** A single topical blog post by slug (full HTML). */
  async getPost(slug: string) {
    return this.conn.collection('blogposts').findOne({ slug });
  }

  /**
   * The Journal (blog) feed — ONLY artists who have a written editorial
   * `feature` story, shaped as blog posts (cover/avatar, headline, excerpt).
   * Distinct from /all-artist (the full artist directory).
   */
  async listJournal(limit = 80) {
    const pipeline = [
      { $match: { role: 'artist', isActive: true } },
      {
        $lookup: {
          from: 'artistprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      { $addFields: { p: { $arrayElemAt: ['$profile', 0] } } },
      { $match: { 'p.feature': { $type: 'string', $ne: '' } } },
      {
        $lookup: {
          from: 'artworks',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$artist', '$$uid'] }, status: 'submitted' } },
            { $limit: 1 },
            { $project: { images: 1 } },
          ],
          as: 'aw',
        },
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1,
          coverImage: 1,
          location: 1,
          headline: '$p.headline',
          artDimensions: '$p.artDimensions',
          feature: '$p.feature',
          featureSource: '$p.featureSource',
          updatedAt: '$p.updatedAt',
          coverArt: { $arrayElemAt: ['$aw.images', 0] },
        },
      },
      { $sort: { updatedAt: -1, _id: 1 } },
      { $limit: limit },
    ];
    const rows = await this.userRepo.userModel.aggregate(pipeline as any);
    // Build a plain-text excerpt from the HTML feature; drop the full HTML.
    const items = rows.map((r: any) => {
      const excerpt = String(r.feature || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 210);
      const { feature, ...rest } = r;
      void feature;
      return { ...rest, excerpt };
    });
    return { items, total: items.length };
  }

  async getArtist(username: string) {
    const user = await this.userRepo.findUserByUsername(username.toLowerCase(), {
      password: 0,
      phone: 0,
    });
    if (!user) return null;
    const [profile, artworks] = await Promise.all([
      this.userRepo.findArtistProfile(user._id.toString()),
      this.artworkModel
        .find({ artist: user._id, status: 'submitted' })
        .select('title cost currency medium theme imagePrefix images')
        .sort({ createdAt: -1 })
        .limit(60)
        .lean(),
    ]);
    return { user, profile, artworks };
  }

  async getArtwork(id: string) {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;
    return this.artworkModel
      .findById(id)
      .populate('artist', 'username firstName lastName pilotSeller')
      .lean();
  }
}

/** Escape user input before using it inside a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
