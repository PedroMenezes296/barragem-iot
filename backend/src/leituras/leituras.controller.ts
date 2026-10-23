import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LeiturasService } from './leituras.service.js';
import { CreateLeituraDto } from './dto/create-leitura.dto.js';
import { UpdateLeituraDto } from './dto/update-leitura.dto.js';

@Controller('leituras')
export class LeiturasController {
  constructor(private readonly leiturasService: LeiturasService) {}

  @Post()
  create(@Body() dados : Record<string, unknown>) {
    return this.leiturasService.create(dados);
  }

  @Get()
  findAll() {
    return this.leiturasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leiturasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeituraDto: UpdateLeituraDto) {
    return this.leiturasService.update(+id, updateLeituraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leiturasService.remove(+id);
  }
}
