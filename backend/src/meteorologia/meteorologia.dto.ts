import { ApiProperty } from '@nestjs/swagger';

export class ForecastDayDto {
  @ApiProperty({
    example: '2026-11-25',
    description: 'Dia local da previsão (YYYY-MM-DD).',
  })
  data!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    description: 'Precipitação total prevista em mm; null indica dado ausente.',
  })
  precipitacaoMm!: number | null;
}

export class ForecastResponseDto {
  @ApiProperty({ example: 'Open-Meteo' }) fonte!: string;
  @ApiProperty({ example: 'Local do reservatório' }) localidade!: string;
  @ApiProperty({ example: 'America/Sao_Paulo' }) fusoHorario!: string;
  @ApiProperty({
    format: 'date-time',
    description: 'Horário em que a previsão foi consultada no provedor.',
  })
  consultadoEm!: string;
  @ApiProperty({
    type: [ForecastDayDto],
    description: 'Hoje e os próximos seis dias, no fuso configurado.',
  })
  dias!: ForecastDayDto[];
}
