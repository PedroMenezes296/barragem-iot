import { Controller, Get, Post, Body } from '@nestjs/common';
import { LeiturasService } from './leituras.service.js';

@Controller('leituras')
export class LeiturasController {

  constructor(
    private readonly leiturasService: LeiturasService,
  ) {}

  // Recebe os dados enviados pelo Arduino
  @Post()
  create(@Body() dados: Record<string, unknown>) {
    return this.leiturasService.create(dados);
  }

  // Consulta todas as leituras armazenadas
  @Get()
  findAll() {
    return this.leiturasService.findAll();
  }
}