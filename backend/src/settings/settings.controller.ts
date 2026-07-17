import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Auth } from '../auth/decorators';
import { Role } from '../generated/prisma/client';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'List service configuration settings (ADMIN)' })
  @Auth(Role.admin)
  findAll() {
    return this.settingsService.findAll();
  }

  @Patch()
  @ApiOperation({ summary: 'Persist service configuration overrides (ADMIN)' })
  @Auth(Role.admin)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
