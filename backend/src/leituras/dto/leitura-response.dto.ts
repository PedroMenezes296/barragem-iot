import { ApiProperty } from '@nestjs/swagger';

// Modelos exclusivos da documentação; não participam da persistência ou validação.
export class LeituraResponseDto {
  @ApiProperty({
    type: String,
    description: 'ObjectId do MongoDB exposto pelo Prisma como id.',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Versão do contrato armazenada.',
    example: 1,
  })
  versao!: number;

  @ApiProperty({
    type: String,
    description: 'Identificador do dispositivo.',
    example: 'arduino-mega-01',
  })
  idDispositivo!: string;

  @ApiProperty({
    type: String,
    description: 'Identificador da medição.',
    example: 'arduino-mega-01-20261022T160000-001',
  })
  idLeitura!: string;

  @ApiProperty({
    type: String,
    description: 'Horário da medição armazenado como texto ISO 8601 com fuso.',
    example: '2026-10-22T16:00:00-03:00',
  })
  timestampRtc!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Distância sensor–água em cm; null quando ausente.',
    example: 35.7,
  })
  distanciaCm!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Nível em cm calculado pelo backend (distanciaFundoCm - distanciaCm); null sem referência válida para o dispositivo ou distância mensurável. Zero é válido.',
    example: 14.3,
  })
  nivelUltrassonicoCm!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Nível resistivo em cm; null quando ausente.',
    example: 3.2,
  })
  nivelResistivoCm!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Umidade relativa em porcentagem; null quando ausente.',
    example: 65,
  })
  umidadePct!: number | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description:
      'Horário de recebimento gerado pelo banco, serializado em UTC.',
    example: '2026-10-22T19:00:01.000Z',
  })
  recebidoEm!: string;
}

export class CreateLeituraResponseDto {
  @ApiProperty({
    type: String,
    description: 'Confirmação de armazenamento.',
    example: 'Leitura armazenada com sucesso!',
  })
  mensagem!: string;

  @ApiProperty({
    type: LeituraResponseDto,
    description: 'Leitura persistida no MongoDB.',
  })
  leitura!: LeituraResponseDto;
}
