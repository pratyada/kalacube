import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Artwork } from '../explore/schemas/artwork.schema';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Artwork.name) private artworkModel: Model<Artwork>,
    @InjectConnection() private conn: Connection,
    private userRepo: UserRepository,
  ) {}

  async stats() {
    const users = this.userRepo.userModel;
    const [totalUsers, artists, artworks, submitted, artspaces, events, artstyles] =
      await Promise.all([
        users.countDocuments(),
        users.countDocuments({ role: 'artist' }),
        this.artworkModel.countDocuments(),
        this.artworkModel.countDocuments({ status: 'submitted' }),
        this.conn.collection('artspaces').countDocuments(),
        this.conn.collection('events').countDocuments(),
        this.conn.collection('artstyles').countDocuments(),
      ]);
    return { totalUsers, artists, artworks, submitted, artspaces, events, artstyles };
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

  async updateUser(id: string, dto: { role?: string; isActive?: boolean }) {
    const set: any = {};
    if (dto.role !== undefined) set.role = dto.role;
    if (dto.isActive !== undefined) set.isActive = dto.isActive;
    const u = await this.userRepo.userModel.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, projection: { password: 0 } },
    );
    if (!u) throw new NotFoundException('User not found');
    return u;
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
}
