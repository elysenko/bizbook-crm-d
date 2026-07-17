import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Auth } from '../auth/decorators';
import { Role } from '../generated/prisma/client';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // Reads are available to any authenticated user so USERs can pick a client when booking.
  @Get()
  @ApiOperation({ summary: 'List all clients' })
  @Auth(Role.admin, Role.user)
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by id' })
  @Auth(Role.admin, Role.user)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  // Mutations are ADMIN-only.
  @Post()
  @ApiOperation({ summary: 'Create a client (ADMIN)' })
  @Auth(Role.admin)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client (ADMIN)' })
  @Auth(Role.admin)
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client (ADMIN)' })
  @Auth(Role.admin)
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
