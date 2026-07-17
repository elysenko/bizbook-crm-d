import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Auth } from 'src/auth/decorators';
import { Role } from '@generated/prisma/client';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Reads are available to any authenticated user so USERs can pick a service when booking.
  @Get()
  @ApiOperation({ summary: 'List all services' })
  @Auth(Role.admin, Role.user)
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by id' })
  @Auth(Role.admin, Role.user)
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  // Mutations are ADMIN-only.
  @Post()
  @ApiOperation({ summary: 'Create a service (ADMIN)' })
  @Auth(Role.admin)
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service (ADMIN)' })
  @Auth(Role.admin)
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service (ADMIN)' })
  @Auth(Role.admin)
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
