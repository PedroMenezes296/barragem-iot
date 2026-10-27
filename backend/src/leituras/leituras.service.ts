import { Injectable } from '@nestjs/common';
import { CreateLeituraDto } from './dto/create-leitura.dto.js';

@Injectable()
export class LeiturasService {

  // Armazena as leituras temporariamente em memória
  private readonly leituras: CreateLeituraDto[] = [];

  // Recebe e armazena uma nova leitura
  create(createLeituraDto: CreateLeituraDto) {

    const leitura = {
      ...createLeituraDto,
      recebidoEm: new Date().toISOString(),
    };

    this.leituras.push(leitura);

    console.log('Nova leitura recebida:', leitura);

    return {
      mensagem: 'Leitura recebida com sucesso!',
      leitura,
    };
  }

  // Retorna todas as leituras armazenadas
  findAll() {
    return this.leituras;
  }
}