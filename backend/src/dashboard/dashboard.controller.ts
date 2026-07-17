import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Auth } from '../auth/decorators';
import { Role } from '../generated/prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // The Front Desk "Today" view is available to both USER and ADMIN.
  @Get('today')
  @ApiOperation({ summary: "Today's appointments and remaining count" })
  @Auth(Role.admin, Role.user)
  today() {
    return this.dashboardService.today();
  }
}
