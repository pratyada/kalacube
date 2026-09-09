import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artwork } from './schemas/artwork.schema';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class ExploreService {
  constructor(
    @InjectModel(Artwork.name) private artworkModel: Model<Artwork>,
    private readonly userRepo: UserRepository,
  ) {}

  async listArtworks(page = 1, limit = 24) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.artworkModel
        .find({ status: 'submitted' })
        .select('title cost currency medium theme imagePrefix images artist createdAt')
        .populate('artist', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.artworkModel.countDocuments({ status: 'submitted' }),
    ]);
    return { items: data, total, page, limit };
  }

  async listArtists(page = 1, limit = 24) {
    const skip = (page - 1) * limit;
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
    const [data, total] = await Promise.all([
      this.userRepo.userModel.aggregate(pipeline as any),
      this.userRepo.userModel.countDocuments({ role: 'artist', isActive: true }),
    ]);
    return { items: data, total, page, limit };
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
      .populate('artist', 'username firstName lastName')
      .lean();
  }
}
