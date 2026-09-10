import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Artwork, ArtworkSchema } from '../explore/schemas/artwork.schema';
import { S3Module } from '../s3/s3.module';
import { ArtworkController } from './artwork.controller';
import { ArtworkService } from './artwork.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artwork.name, schema: ArtworkSchema }]),
    S3Module,
  ],
  controllers: [ArtworkController],
  providers: [ArtworkService],
})
export class ArtworkModule {}
