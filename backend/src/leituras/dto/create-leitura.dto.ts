import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsInt,
  IsString,
  IsNotEmpty,
  IsISO8601,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateLeituraDto {
  // Versão do contrato JSON
  @IsInt()
  @Equals(1)
  @ApiProperty({
    type: 'integer',
    enum: [1],
    description: 'Versão do contrato JSON, atualmente igual a 1.',
    example: 1,
  })
  versao!: number;

  // Identificação do Arduino
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    minLength: 1,
    description: 'Identificador estável do Arduino.',
    example: 'arduino-mega-01',
  })
  idDispositivo!: string;

  // Identificação única da medição
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    minLength: 1,
    description:
      'Identificador da medição, preservado em reenvios. A combinação com idDispositivo é única no banco.',
    example: 'arduino-mega-01-20261022T160000-001',
  })
  idLeitura!: string;

  // Horário registrado pelo RTC
  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  @ApiProperty({
    type: String,
    format: 'date-time',
    pattern: '(Z|[+-]\\d{2}:\\d{2})$',
    description:
      'Data e hora da medição no RTC em ISO 8601 com fuso obrigatório.',
    example: '2026-10-22T16:00:00-03:00',
  })
  timestampRtc!: string;

  // Distância medida pelo HC-SR04
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    nullable: true,
    description:
      'Distância do HC-SR04 à superfície da água, em cm; entrada do cálculo no backend (referência - distância). Faixa mensurável: 2 a 400 cm e até a referência. Fora dela, nível salvo como null. Omitir quando indisponível; também aceita null.',
    example: 35.7,
  })
  distanciaCm?: number;

  // Nível calculado pelo ultrassônico
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    deprecated: true,
    type: Number,
    minimum: 0,
    nullable: true,
    description:
      'Legado: aceito temporariamente para compatibilidade, mas ignorado. O backend calcula o nível exclusivamente pela distância e referência configurada.',
    example: 14.3,
  })
  nivelUltrassonicoCm?: number;

  // Nível calculado pelo sensor resistivo
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    nullable: true,
    description:
      'Nível da água em cm dentro da faixa calibrada do sensor resistivo. Omitir sem calibração; o validador atual também aceita null.',
    example: 3.2,
  })
  nivelResistivoCm?: number;

  // Umidade relativa do ar
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    maximum: 100,
    nullable: true,
    description:
      'Umidade relativa do ar em porcentagem. Omitir quando indisponível; o validador atual também aceita null.',
    example: 65,
  })
  umidadePct?: number;
}
