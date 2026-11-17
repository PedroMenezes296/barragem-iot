import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { LeiturasService } from './leituras.service.js';
import { CreateLeituraDto } from './dto/create-leitura.dto.js';
import {
  CreateLeituraResponseDto,
  LeituraResponseDto,
} from './dto/leitura-response.dto.js';

@ApiTags('Leituras')
@ApiInternalServerErrorResponse({
  description:
    'Erro não tratado de persistência/consulta. Duplicidades também não possuem tratamento específico e resultam em erro interno.',
  schema: {
    type: 'object',
    required: ['statusCode', 'message'],
    properties: {
      statusCode: { type: 'integer', example: 500 },
      message: { type: 'string', example: 'Internal server error' },
    },
  },
})
@Controller('leituras')
export class LeiturasController {
  constructor(private readonly leiturasService: LeiturasService) {}

  // Recebe os dados enviados pelo Arduino
  @Post()
  @ApiOperation({
    summary: 'Receber e armazenar uma leitura dos sensores',
    description:
      'Valida o JSON V1 e persiste os campos no MongoDB. Campos desconhecidos são rejeitados. Atualmente os quatro campos de medição são opcionais individualmente, sem exigir ao menos um deles. Não há confirmação idempotente para reenvios duplicados.',
  })
  @ApiBody({ type: CreateLeituraDto, required: true })
  @ApiCreatedResponse({
    description: 'Leitura armazenada com sucesso.',
    type: CreateLeituraResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'JSON inválido, campo obrigatório ausente, valor inválido ou propriedade desconhecida.',
    schema: {
      type: 'object',
      required: ['statusCode', 'message', 'error'],
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          example: ['versao must be equal to 1'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  create(@Body() createLeituraDto: CreateLeituraDto) {
    return this.leiturasService.create(createLeituraDto);
  }

  // Consulta todas as leituras armazenadas
  @Get()
  @ApiOperation({
    summary: 'Consultar todas as leituras armazenadas',
    description:
      'Retorna as leituras em ordem decrescente de recebidoEm. Não há filtros, parâmetros de consulta ou paginação implementados.',
  })
  @ApiOkResponse({
    description: 'Lista de leituras, vazia quando não há registros.',
    type: LeituraResponseDto,
    isArray: true,
  })
  findAll() {
    return this.leiturasService.findAll();
  }
}
