import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const MIN_SENSOR_DISTANCE_CM = 2;
export const MAX_SENSOR_DISTANCE_CM = 400;
export const ALARM_STATES = [
  'desativado',
  'sem_dados',
  'desatualizado',
  'normal',
  'seca',
  'atencao',
  'inundacao',
] as const;
export type AlarmState = (typeof ALARM_STATES)[number];

export class UpdateAlarmConfigDto {
  @ApiProperty({ example: 'arduino-mega-01' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,80}$/)
  idDispositivo!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  ativo!: boolean;

  @ApiProperty({
    minimum: MIN_SENSOR_DISTANCE_CM,
    maximum: MAX_SENSOR_DISTANCE_CM,
    exclusiveMinimum: true,
    example: 5.75,
    description:
      'Distância sensor–fundo com reservatório vazio. O máximo mensurável é esta referência menos 2 cm.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(MIN_SENSOR_DISTANCE_CM)
  @Max(MAX_SENSOR_DISTANCE_CM)
  distanciaFundoCm!: number;

  @ApiProperty({
    minimum: 0,
    maximum: 100,
    default: 20,
    description:
      'Percentual de seca: alarme entre zero e secaPct, inclusive. Padrão: 20%.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  secaPct: number = 20;

  @ApiProperty({
    minimum: 0,
    maximum: 100,
    default: 80,
    description:
      'Percentual de atenção: >= atencaoPct e < inundacaoPct. Padrão: 80%.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  atencaoPct: number = 80;

  @ApiProperty({
    minimum: 0,
    maximum: 100,
    default: 95,
    description:
      'Percentual de inundação: alarme quando >= inundacaoPct. Padrão: 95%.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  inundacaoPct: number = 95;

  @ApiProperty({
    minimum: 0,
    exclusiveMinimum: true,
    description:
      'Altura da água em 100%, independente do limite de inundação. Máximo: distanciaFundoCm - 2.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  alturaCheioCm!: number;
}

export class AlarmConfigDto {
  @ApiProperty({
    enum: [1, 2],
    description:
      '1: configuração legada em cm, pendente de calibração; 2: limites percentuais.',
  })
  versao!: number;
  @ApiProperty({ type: Number, nullable: true }) alturaCheioCm!: number | null;
  @ApiProperty({ default: 20 }) secaPct!: number;
  @ApiProperty({ default: 80 }) atencaoPct!: number;
  @ApiProperty({ default: 95 }) inundacaoPct!: number;
  @ApiProperty() idDispositivo!: string;
  @ApiProperty() ativo!: boolean;
  @ApiProperty({ type: Number, nullable: true })
  distanciaFundoCm!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    deprecated: true,
    description: 'Somente na configuração legada V1, para conversão explícita.',
  })
  secaCm!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    deprecated: true,
    description: 'Somente na configuração legada V1, para conversão explícita.',
  })
  atencaoCm!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    deprecated: true,
    description: 'Somente na configuração legada V1, para conversão explícita.',
  })
  inundacaoCm!: number | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  atualizadoEm!: string | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 3.75,
    description: 'distanciaFundoCm - 2; null sem referência configurada.',
  })
  nivelMaximoConfiguravelCm!: number | null;
}

export class AlarmStatusQueryDto {
  @ApiPropertyOptional({
    description:
      'Dispositivo solicitante. Outro dispositivo recebe estado desativado.',
    example: 'arduino-mega-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,80}$/)
  idDispositivo?: string;
}

export class AlarmStatusDto {
  @ApiProperty({ description: 'Dispositivo ao qual este comando se aplica.' })
  idDispositivo!: string;
  @ApiProperty({ enum: [...ALARM_STATES] }) estado!: AlarmState;
  @ApiProperty() alarmeAtivo!: boolean;
  @ApiProperty({ type: Number, nullable: true }) nivelCm!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Percentual da altura: nivelCm / alturaCheioCm * 100, sem limitar a 100%. Disponível mesmo com alarmes desativados; null sem calibração ou leitura válida. Não representa volume nem confirmação do alarme físico.',
  })
  percentualNivelPct!: number | null;
  @ApiProperty({ type: String, nullable: true }) idLeitura!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  recebidoEm!: string | null;
}
