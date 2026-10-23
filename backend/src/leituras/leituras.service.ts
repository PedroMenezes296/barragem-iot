import { Injectable } from '@nestjs/common';

@Injectable()
export class LeiturasService {

  // Armazena as leituras temporariamente em memória
  private readonly leituras: Record<string, unknown>[] = [];

  // Recebe e armazena uma nova leitura
  create(dados: Record<string, unknown>) {

    const leitura = {
      ...dados,
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