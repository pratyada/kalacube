import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/** Admin-only management API. Requires auth (global guard) + admin role. */
@Controller('api/admin')
@Roles('admin', 'superadmin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.admin.listUsers(Number(page), Number(limit), search, role);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: { role?: string; isActive?: boolean; isFeatured?: boolean },
  ) {
    return this.admin.updateUser(id, dto);
  }

  @Get('featured')
  featured() {
    return this.admin.listFeatured();
  }

  @Get('artworks')
  artworks(
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.admin.listArtworks(Number(page), Number(limit), status, search);
  }

  @Patch('artworks/:id')
  updateArtwork(@Param('id') id: string, @Body() dto: { status?: string }) {
    return this.admin.updateArtwork(id, dto);
  }

  @Delete('artworks/:id')
  deleteArtwork(@Param('id') id: string) {
    return this.admin.deleteArtwork(id);
  }

  @Get('artspaces')
  artspaces() {
    return this.admin.listArtspaces();
  }

  @Get('events')
  events() {
    return this.admin.listEvents();
  }

  // --- Email & Marketing ---

  @Get('recipients')
  recipients(@Query('segment') segment = 'all') {
    return this.admin.recipients(segment);
  }

  @Post('campaigns')
  createCampaign(
    @Body()
    dto: {
      subject?: string;
      bodyHtml?: string;
      segment?: string;
      testEmail?: string;
      confirm?: boolean;
    },
    @CurrentUser('email') email?: string,
  ) {
    return this.admin.createCampaign(dto, email);
  }

  @Get('campaigns')
  campaigns() {
    return this.admin.listCampaigns();
  }
}
