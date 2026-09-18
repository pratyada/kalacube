import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './types/user.types';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async listUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const result = await this.userService.listUsers(
      +page,
      +limit,
      search,
      role,
    );
    return {
      data: result.data,
      message: 'Users fetched',
      meta: {
        total: result.total,
        page: +page,
        limit: +limit,
        lastPage: Math.ceil(result.total / +limit),
      },
    };
  }

  @Get(':username')
  @Public()
  async getProfile(@Param('username') username: string) {
    const profile = await this.userService.getUserProfile(username);
    return { data: profile, message: 'Profile fetched' };
  }

  @Patch(':username')
  async updateProfile(
    @Param('username') username: string,
    @CurrentUser('_id') currentUserId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(username, currentUserId, dto);
  }

  // Owner-scoped avatar / cover upload. Authed users only; the service checks
  // that the authed user owns `:username` (403 otherwise).
  @Post(':username/images')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      { limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  async uploadProfileImages(
    @Param('username') username: string,
    @CurrentUser('_id') currentUserId: string,
    @UploadedFiles()
    files: {
      avatar?: { buffer: Buffer; originalname: string; mimetype: string }[];
      cover?: { buffer: Buffer; originalname: string; mimetype: string }[];
    },
  ) {
    return this.userService.uploadProfileImages(
      username,
      currentUserId,
      files,
    );
  }

  @Delete(':username')
  async deactivateAccount(@Param('username') username: string) {
    return this.userService.deactivateUser(username);
  }

  // Artist Profile
  @Get(':username/artist-profile')
  @Public()
  async getArtistProfile(@Param('username') username: string) {
    const profile = await this.userService.getUserProfile(username);
    return { data: profile.roleProfile, message: 'Artist profile fetched' };
  }

  @Put(':username/artist-profile')
  @Roles(UserRole.ARTIST)
  async upsertArtistProfile(
    @Param('username') username: string,
    @CurrentUser('_id') currentUserId: string,
    @Body() dto: UpdateArtistProfileDto,
  ) {
    const profile = await this.userService.upsertArtistProfile(
      username,
      currentUserId,
      dto,
    );
    return { data: profile, message: 'Artist profile updated' };
  }

  // Curator Profile
  @Put(':username/curator-profile')
  @Roles(UserRole.CURATOR)
  async upsertCuratorProfile(
    @Param('username') username: string,
    @CurrentUser('_id') currentUserId: string,
    @Body() dto: any,
  ) {
    const profile = await this.userService.upsertCuratorProfile(
      username,
      currentUserId,
      dto,
    );
    return { data: profile, message: 'Curator profile updated' };
  }

  // Art Space Profile
  @Put(':username/art-space-profile')
  @Roles(UserRole.ARTSPACE)
  async upsertArtSpaceProfile(
    @Param('username') username: string,
    @CurrentUser('_id') currentUserId: string,
    @Body() dto: any,
  ) {
    const profile = await this.userService.upsertArtSpaceProfile(
      username,
      currentUserId,
      dto,
    );
    return { data: profile, message: 'Art space profile updated' };
  }
}
