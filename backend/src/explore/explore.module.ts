import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { Artwork, ArtworkSchema } from './schemas/artwork.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artwork.name, schema: ArtworkSchema }]),
    UserModule, // for UserRepository (artists aggregation)
  ],
  controllers: [ExploreController],
  providers: [ExploreService],
})
export class ExploreModule {}
