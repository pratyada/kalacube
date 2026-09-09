import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ExploreService } from './explore.service';
import { Public } from '../common/decorators/public.decorator';

/** Public gallery browse — no auth required. */
@Controller('api/explore')
export class ExploreController {
  constructor(private readonly explore: ExploreService) {}

  @Public()
  @Get('artworks')
  artworks(@Query('page') page = '1', @Query('limit') limit = '24') {
    return this.explore.listArtworks(Number(page), Number(limit));
  }

  @Public()
  @Get('artworks/:id')
  async artwork(@Param('id') id: string) {
    const art = await this.explore.getArtwork(id);
    if (!art) throw new NotFoundException('Artwork not found');
    return art;
  }

  @Public()
  @Get('artists')
  artists(
    @Query('page') page = '1',
    @Query('limit') limit = '24',
    @Query('dimension') dimension?: string,
    @Query('search') search?: string,
  ) {
    return this.explore.listArtists(Number(page), Number(limit), dimension, search);
  }

  @Public()
  @Get('artists/:username')
  async artist(@Param('username') username: string) {
    const data = await this.explore.getArtist(username);
    if (!data) throw new NotFoundException('Artist not found');
    return data;
  }
}
