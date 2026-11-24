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
    description:
      'Altura da água; alarme quando nível <= secaCm. Máximo: distanciaFundoCm - 2.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  secaCm!: number;

  @ApiProperty({
    minimum: 0,
    description:
      'Altura da água; atenção quando nível >= atencaoCm e < inundacaoCm. Máximo: distanciaFundoCm - 2.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  atencaoCm!: number;

  @ApiProperty({
    minimum: 0,
    description:
      'Altura da água; alarme quando nível >= inundacaoCm. Máximo: distanciaFundoCm - 2.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  inundacaoCm!: number;
}

export class AlarmConfigDto {
  @ApiProperty() idDispositivo!: string;
  @ApiProperty() ativo!: boolean;
  @ApiProperty({ type: Number, nullable: true })
  distanciaFundoCm!: number | null;
  @ApiProperty({ type: Number, nullable: true }) secaCm!: number | null;
  @ApiProperty({ type: Number, nullable: true }) atencaoCm!: number | null;
  @ApiProperty({ type: Number, nullable: true }) inundacaoCm!: number | null;
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
    description: 'Percentual da altura: nivelCm / inundacaoCm * 100, sem limitar a 100%. Não representa volume nem confirmação do alarme físico.',
  })
  percentualNivelPct!: number | null;
  @ApiProperty({ type: String, nullable: true }) idLeitura!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  recebidoEm!: string | null;
}
