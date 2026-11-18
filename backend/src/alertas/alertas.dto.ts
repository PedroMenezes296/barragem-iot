import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const MAX_LEVEL_CM = 3.75;
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
    minimum: 0,
    maximum: MAX_LEVEL_CM,
    description: 'Altura da água; alarme quando nível <= secaCm.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_LEVEL_CM)
  secaCm!: number;

  @ApiProperty({
    minimum: 0,
    maximum: MAX_LEVEL_CM,
    description:
      'Altura da água; atenção quando nível >= atencaoCm e < inundacaoCm.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_LEVEL_CM)
  atencaoCm!: number;

  @ApiProperty({
    minimum: 0,
    maximum: MAX_LEVEL_CM,
    description: 'Altura da água; alarme quando nível >= inundacaoCm.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_LEVEL_CM)
  inundacaoCm!: number;
}

export class AlarmConfigDto {
  @ApiProperty() idDispositivo!: string;
  @ApiProperty() ativo!: boolean;
  @ApiProperty({ type: Number, nullable: true }) secaCm!: number | null;
  @ApiProperty({ type: Number, nullable: true }) atencaoCm!: number | null;
  @ApiProperty({ type: Number, nullable: true }) inundacaoCm!: number | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  atualizadoEm!: string | null;
  @ApiProperty({ example: MAX_LEVEL_CM }) nivelMaximoConfiguravelCm!: number;
}

export class AlarmStatusDto {
  @ApiProperty({ enum: [...ALARM_STATES] }) estado!: AlarmState;
  @ApiProperty() alarmeAtivo!: boolean;
  @ApiProperty({ type: Number, nullable: true }) nivelCm!: number | null;
  @ApiProperty({ type: String, nullable: true }) idLeitura!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  recebidoEm!: string | null;
}
