import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ArtworkService } from './artwork.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/types/user.types';

/** Authenticated artist authoring endpoints. */
@Controller('api/artworks')
@Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.SUPERADMIN)
export class ArtworkController {
  constructor(private readonly artwork: ArtworkService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 8))
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateArtworkDto,
    @UploadedFiles()
    files: { buffer: Buffer; originalname: string; mimetype: string }[],
  ) {
    return this.artwork.create(user, dto, files);
  }

  @Get('mine')
  mine(@CurrentUser('_id') userId: string) {
    return this.artwork.listMine(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: Partial<CreateArtworkDto>,
  ) {
    return this.artwork.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.artwork.remove(id, userId);
  }
}
