import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';
import { PRIVATE_USER_FIELDS, UserRole } from './types/user.types';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

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
      throw new ConflictException('You can only update your own profile');
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepo.userExists({ email: dto.email });
      if (exists) throw new ConflictException('Email already in use');
    }

    await this.userRepo.updateUser({ _id: user._id }, { $set: dto as any });
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
      throw new ConflictException('You can only update your own profile');
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
