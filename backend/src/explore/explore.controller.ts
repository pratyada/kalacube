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
  @Get('categories')
  categories() {
    return this.explore.getCategories();
  }

  @Public()
  @Get('artworks')
  artworks(
    @Query('page') page = '1',
    @Query('limit') limit = '24',
    @Query('domain') domain?: string,
    @Query('category') category?: string,
    @Query('specialist') specialist?: string,
    @Query('search') search?: string,
  ) {
    return this.explore.listArtworks(
      Number(page),
      Number(limit),
      domain,
      category,
      specialist,
      search,
    );
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
    @Query('search') search?: string,
    @Query('domain') domain?: string,
    @Query('category') category?: string,
    @Query('specialist') specialist?: string,
  ) {
    return this.explore.listArtists(
      Number(page),
      Number(limit),
      search,
      domain,
      category,
      specialist,
    );
  }

  /** The Journal (blog) feed — only artists with a written feature story. */
  @Public()
  @Get('journal')
  journal(@Query('limit') limit = '80') {
    return this.explore.listJournal(Number(limit));
  }

  @Public()
  @Get('artists/:username')
  async artist(@Param('username') username: string) {
    const data = await this.explore.getArtist(username);
    if (!data) throw new NotFoundException('Artist not found');
    return data;
  }
}
