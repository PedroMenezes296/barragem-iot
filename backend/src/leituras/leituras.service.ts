
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeituraDto } from './dto/create-leitura.dto.js';

@Injectable()
export class LeiturasService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Salva uma nova leitura no MongoDB
  async create(dados: CreateLeituraDto) {

    const leitura = await this.prisma.leitura.create({
      data: {
        versao: dados.versao,
        idDispositivo: dados.idDispositivo,
        idLeitura: dados.idLeitura,
        timestampRtc: dados.timestampRtc,

        distanciaCm: dados.distanciaCm,
        nivelUltrassonicoCm: dados.nivelUltrassonicoCm,
        nivelResistivoCm: dados.nivelResistivoCm,
        umidadePct: dados.umidadePct,
      },
    });

    console.log('Leitura salva no MongoDB:', leitura);

    return {
      mensagem: 'Leitura armazenada com sucesso!',
      leitura,
    };
  }

  // Consulta as leituras salvas no MongoDB
  async findAll() {

    return this.prisma.leitura.findMany({
      orderBy: {
        recebidoEm: 'desc',
      },
    });

  }
}
