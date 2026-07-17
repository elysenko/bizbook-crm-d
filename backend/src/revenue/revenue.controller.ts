import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import { Auth } from '../auth/decorators';
import { Role } from '../generated/prisma/client';

@ApiTags('Revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  // Revenue reporting is ADMIN-only.
  @Get('summary')
  @ApiOperation({ summary: 'Weekly and monthly completed revenue totals (ADMIN)' })
  @Auth(Role.admin)
  summary() {
    return this.revenueService.summary();
  }
}
