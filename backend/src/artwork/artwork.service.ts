import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Artwork } from '../explore/schemas/artwork.schema';
import { S3Service } from '../s3/s3.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';

type UploadedImage = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

/** Owner-scoped artwork authoring (create w/ image upload, list, edit, delete). */
@Injectable()
export class ArtworkService {
  constructor(
    @InjectModel(Artwork.name) private artworkModel: Model<Artwork>,
    private readonly s3: S3Service,
  ) {}

  async create(
    user: { _id: Types.ObjectId; legacyIdentityId?: string },
    dto: CreateArtworkDto,
    files: UploadedImage[] = [],
  ) {
    const dimensions =
      dto.heightCm || dto.widthCm
        ? { height: dto.heightCm ?? 0, width: dto.widthCm ?? 0 }
        : undefined;

    const doc = await this.artworkModel.create({
      artist: user._id,
      status: dto.status === 'draft' ? 'draft' : 'submitted',
      title: dto.title,
      description: dto.description,
      cost: dto.cost,
      currency: dto.currency || 'INR',
      medium: dto.medium,
      material: dto.material,
      theme: dto.theme,
      dimensions,
      available: dto.available ? dto.available === 'true' : true,
      images: [],
    });

    // Upload under the public-read `protected/*` prefix so URLs render like the
    // migrated artworks. Existing artists keep their legacy identity prefix.
    const ownerKey = user.legacyIdentityId || user._id.toString();
    const prefix = `protected/${ownerKey}/artist_work/${doc._id.toString()}`;

    try {
      const urls: string[] = [];
      for (const file of files) {
        if (!file?.mimetype?.startsWith('image/')) continue;
        const { key } = await this.s3.uploadFile({ file, location: prefix });
        urls.push(this.s3.getPublicUrl(key));
      }
      if (urls.length) {
        doc.images = urls;
        doc.imagePrefix = `${prefix}/`;
        await doc.save();
      }
    } catch (err) {
      // Don't leave an image-less orphan if the S3 upload fails — roll back.
      await this.artworkModel.findByIdAndDelete(doc._id).catch(() => undefined);
      throw err;
    }

    return { data: doc, message: 'Artwork created' };
  }

  async listMine(userId: string) {
    const items = await this.artworkModel
      .find({ artist: userId })
      .sort({ createdAt: -1 })
      .lean();
    return { data: { items, total: items.length } };
  }

  private async ownedOrThrow(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Artwork not found');
    const art = await this.artworkModel.findById(id);
    if (!art) throw new NotFoundException('Artwork not found');
    // userId may arrive as an ObjectId (from @CurrentUser('_id')) — compare as strings.
    if (String(art.artist) !== String(userId)) {
      throw new ForbiddenException('Not your artwork');
    }
    return art;
  }

  async update(id: string, userId: string, dto: Partial<CreateArtworkDto>) {
    const art = await this.ownedOrThrow(id, userId);
    const set: Record<string, unknown> = {};
    for (const f of [
      'title',
      'description',
      'cost',
      'currency',
      'medium',
      'material',
      'theme',
      'status',
    ] as const) {
      if (dto[f] !== undefined) set[f] = dto[f];
    }
    if (dto.available !== undefined) set.available = dto.available === 'true';
    if (dto.heightCm !== undefined || dto.widthCm !== undefined) {
      set.dimensions = { height: dto.heightCm ?? 0, width: dto.widthCm ?? 0 };
    }
    Object.assign(art, set);
    await art.save();
    return { data: art, message: 'Artwork updated' };
  }

  async remove(id: string, userId: string) {
    await this.ownedOrThrow(id, userId);
    await this.artworkModel.findByIdAndDelete(id);
    return { data: { deleted: true } };
  }
}
