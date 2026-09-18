import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { S3Service } from '../s3/s3.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';
import { PRIVATE_USER_FIELDS, UserRole } from './types/user.types';

type UploadedImage = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly s3: S3Service,
  ) {}

  /**
   * Owner-scoped avatar / cover upload. The authed user must own `:username`
   * (else 403). Images land under the same public-read `protected/*` prefix as
   * migrated profile images, then `user.avatar` / `user.coverImage` are set to
   * the public URLs so the artist page renders them immediately.
   */
  async uploadProfileImages(
    username: string,
    currentUserId: string,
    files: { avatar?: UploadedImage[]; cover?: UploadedImage[] },
  ) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    if (user._id.toString() !== currentUserId.toString()) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.cover?.[0];
    if (!avatarFile && !coverFile) {
      throw new BadRequestException('No image provided');
    }
    for (const f of [avatarFile, coverFile]) {
      if (f && !f.mimetype?.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }
    }

    const ownerKey = user.legacyIdentityId || user._id.toString();
    const prefix = `protected/${ownerKey}/profile`;

    const update: Record<string, { key: string; url: string }> = {};
    if (avatarFile) {
      const { key } = await this.s3.uploadFile({
        file: avatarFile,
        location: prefix,
      });
      update.avatar = { key, url: this.s3.getPublicUrl(key) };
    }
    if (coverFile) {
      const { key } = await this.s3.uploadFile({
        file: coverFile,
        location: prefix,
      });
      update.coverImage = { key, url: this.s3.getPublicUrl(key) };
    }

    await this.userRepo.updateUser({ _id: user._id }, { $set: update });
    await this.updateProfileCompleteness(user._id.toString());

    return {
      data: {
        avatar: update.avatar ?? user.avatar,
        coverImage: update.coverImage ?? user.coverImage,
      },
      message: 'Profile images updated',
    };
  }

  async getUserByUsername(username: string) {
    const projection = PRIVATE_USER_FIELDS.reduce(
      (acc, field) => ({ ...acc, [field]: 0 }),
      {},
    );
    const user = await this.userRepo.findUserByUsername(username, projection);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserProfile(username: string) {
    const user = await this.getUserByUsername(username);
    let roleProfile: any = null;

    if (user.role === UserRole.ARTIST) {
      roleProfile = await this.userRepo.findArtistProfile(user._id.toString());
    } else if (user.role === UserRole.CURATOR) {
      roleProfile = await this.userRepo.findCuratorProfile(
        user._id.toString(),
      );
    } else if (user.role === UserRole.ARTSPACE) {
      roleProfile = await this.userRepo.findArtSpaceProfile(
        user._id.toString(),
      );
    }

    return { user, roleProfile };
  }

  async listUsers(
    page: number,
    limit: number,
    search?: string,
    role?: string,
  ) {
    const filter: any = { isActive: true };
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const projection = PRIVATE_USER_FIELDS.reduce(
      (acc, field) => ({ ...acc, [field]: 0 }),
      {},
    );
    return this.userRepo.findUsers(filter, projection, page, limit);
  }

  async updateUser(
    username: string,
    currentUserId: string,
    dto: UpdateUserDto,
  ) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) throw new NotFoundException('User not found');

    if (user._id.toString() !== currentUserId.toString()) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepo.userExists({ email: dto.email });
      if (exists) throw new ConflictException('Email already in use');
    }

    // MERGE nested objects (socialLinks/location) instead of replacing them.
    // The edit form only sends a subset of sub-keys, so a plain `$set` of the
    // whole object would wipe unspecified keys (e.g. a migrated artist's
    // facebook link, which the public page renders). Dot-path each provided
    // sub-key so the rest are preserved.
    const { socialLinks, location, ...rest } = dto as UpdateUserDto & {
      socialLinks?: Record<string, unknown>;
      location?: Record<string, unknown>;
    };
    const $set: Record<string, unknown> = { ...rest };
    if (socialLinks && typeof socialLinks === 'object') {
      for (const [k, v] of Object.entries(socialLinks)) {
        if (v !== undefined) $set[`socialLinks.${k}`] = v;
      }
    }
    if (location && typeof location === 'object') {
      for (const [k, v] of Object.entries(location)) {
        if (v !== undefined) $set[`location.${k}`] = v;
      }
    }

    await this.userRepo.updateUser({ _id: user._id }, { $set });
    await this.updateProfileCompleteness(user._id.toString());

    return { message: 'Profile updated' };
  }

  async deactivateUser(username: string) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.updateUser(
      { _id: user._id },
      { isActive: false },
    );
    return { message: 'Account deactivated' };
  }

  async upsertArtistProfile(
    username: string,
    currentUserId: string,
    dto: UpdateArtistProfileDto,
  ) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    if (user._id.toString() !== currentUserId.toString()) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const profile = await this.userRepo.upsertArtistProfile(
      user._id.toString(),
      dto,
    );
    await this.updateProfileCompleteness(user._id.toString());
    return profile;
  }

  async upsertCuratorProfile(
    username: string,
    currentUserId: string,
    dto: any,
  ) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    if (user._id.toString() !== currentUserId.toString()) {
      throw new ConflictException('You can only update your own profile');
    }

    const profile = await this.userRepo.upsertCuratorProfile(
      user._id.toString(),
      dto,
    );
    await this.updateProfileCompleteness(user._id.toString());
    return profile;
  }

  async upsertArtSpaceProfile(
    username: string,
    currentUserId: string,
    dto: any,
  ) {
    const user = await this.userRepo.findUserByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    if (user._id.toString() !== currentUserId.toString()) {
      throw new ConflictException('You can only update your own profile');
    }

    const profile = await this.userRepo.upsertArtSpaceProfile(
      user._id.toString(),
      dto,
    );
    await this.updateProfileCompleteness(user._id.toString());
    return profile;
  }

  async updateProfileCompleteness(userId: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) return;

    let score = 0;
    if (user.avatar?.key) score += 15;
    if (user.bio) score += 10;
    if (user.location?.city || user.location?.state) score += 10;
    if (user.dob) score += 5;
    if (user.phoneVerifiedAt) score += 10;
    if (user.emailVerifiedAt) score += 10;
    if (
      user.socialLinks?.instagram ||
      user.socialLinks?.twitter ||
      user.socialLinks?.linkedin
    )
      score += 5;

    let hasRoleProfile = false;
    if (user.role === UserRole.ARTIST) {
      const p = await this.userRepo.findArtistProfile(userId);
      if (p) {
        hasRoleProfile = true;
        if (
          p.skills?.length >= 1 &&
          p.artDimensions?.length >= 1 &&
          p.headline
        )
          score += 15;
      }
    } else if (user.role === UserRole.CURATOR) {
      const p = await this.userRepo.findCuratorProfile(userId);
      if (p) {
        hasRoleProfile = true;
        if (p.expertise?.length >= 1 && p.headline) score += 15;
      }
    } else if (user.role === UserRole.ARTSPACE) {
      const p = await this.userRepo.findArtSpaceProfile(userId);
      if (p) {
        hasRoleProfile = true;
        if (p.spaceName && p.address?.city) score += 15;
      }
    } else {
      score += 35;
    }

    if (hasRoleProfile) score += 20;

    await this.userRepo.updateUser(
      { _id: userId },
      { profileCompleteness: Math.min(score, 100) },
    );
  }
}
