import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { User, UserSchema } from './schemas/user.schema';
import {
  ArtistProfile,
  ArtistProfileSchema,
} from './schemas/artist-profile.schema';
import {
  CuratorProfile,
  CuratorProfileSchema,
} from './schemas/curator-profile.schema';
import {
  ArtSpaceProfile,
  ArtSpaceProfileSchema,
} from './schemas/art-space-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ArtistProfile.name, schema: ArtistProfileSchema },
      { name: CuratorProfile.name, schema: CuratorProfileSchema },
      { name: ArtSpaceProfile.name, schema: ArtSpaceProfileSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
