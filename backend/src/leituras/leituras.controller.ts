import { Controller, Get, Post, Body } from '@nestjs/common';
import { LeiturasService } from './leituras.service.js';
import { CreateLeituraDto } from './dto/create-leitura.dto.js';

@Controller('leituras')
export class LeiturasController {

  constructor(
    private readonly leiturasService: LeiturasService,
  ) {}

  // Recebe os dados enviados pelo Arduino
  @Post()
  create(@Body() createLeituraDto: CreateLeituraDto) {
    return this.leiturasService.create(createLeituraDto);
  }

  // Consulta todas as leituras armazenadas
  @Get()
  findAll() {
    return this.leiturasService.findAll();
  }
}