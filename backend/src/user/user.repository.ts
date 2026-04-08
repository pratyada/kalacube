import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ProjectionType } from 'mongoose';
import { User } from './schemas/user.schema';
import { ArtistProfile } from './schemas/artist-profile.schema';
import { CuratorProfile } from './schemas/curator-profile.schema';
import { ArtSpaceProfile } from './schemas/art-space-profile.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) public userModel: Model<User>,
    @InjectModel(ArtistProfile.name)
    private artistProfileModel: Model<ArtistProfile>,
    @InjectModel(CuratorProfile.name)
    private curatorProfileModel: Model<CuratorProfile>,
    @InjectModel(ArtSpaceProfile.name)
    private artSpaceProfileModel: Model<ArtSpaceProfile>,
  ) {}

  async createUser(data: Partial<User>): Promise<User> {
    return this.userModel.create(data as any);
  }

  async findUserById(id: string, projection?: ProjectionType<User>) {
    return this.userModel.findById(id, projection);
  }

  async findUserByEmail(email: string, selectPassword = false) {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (selectPassword) query.select('+password');
    return query;
  }

  async findUserByUsername(
    username: string,
    projection?: ProjectionType<User>,
  ) {
    return this.userModel.findOne(
      { username: username.toLowerCase() },
      projection,
    );
  }

  async findUsers(
    filter: Record<string, any>,
    projection?: ProjectionType<User>,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter, projection)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async updateUser(filter: Record<string, any>, update: Record<string, any>) {
    return this.userModel.findOneAndUpdate(filter, update, { new: true });
  }

  async userExists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.userModel.exists(filter));
  }

  // Artist Profile
  async upsertArtistProfile(userId: string, data: Partial<ArtistProfile>) {
    return this.artistProfileModel.findOneAndUpdate(
      { user: userId },
      { $set: { ...data, user: userId } },
      { upsert: true, new: true },
    );
  }

  async findArtistProfile(userId: string) {
    return this.artistProfileModel.findOne({ user: userId });
  }

  // Curator Profile
  async upsertCuratorProfile(userId: string, data: Partial<CuratorProfile>) {
    return this.curatorProfileModel.findOneAndUpdate(
      { user: userId },
      { $set: { ...data, user: userId } },
      { upsert: true, new: true },
    );
  }

  async findCuratorProfile(userId: string) {
    return this.curatorProfileModel.findOne({ user: userId });
  }

  // Art Space Profile
  async upsertArtSpaceProfile(
    userId: string,
    data: Partial<ArtSpaceProfile>,
  ) {
    return this.artSpaceProfileModel.findOneAndUpdate(
      { user: userId },
      { $set: { ...data, user: userId } },
      { upsert: true, new: true },
    );
  }

  async findArtSpaceProfile(userId: string) {
    return this.artSpaceProfileModel.findOne({ user: userId });
  }
}
