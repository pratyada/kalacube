import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';

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
    @Body() dto: { role?: string; isActive?: boolean },
  ) {
    return this.admin.updateUser(id, dto);
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
}
