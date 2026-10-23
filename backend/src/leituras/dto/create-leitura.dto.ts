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
  versao!: number;

  // Identificação do Arduino
  @IsString()
  @IsNotEmpty()
  idDispositivo!: string;

  // Identificação única da medição
  @IsString()
  @IsNotEmpty()
  idLeitura!: string;

  // Horário registrado pelo RTC
  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  timestampRtc!: string;

  // Distância medida pelo HC-SR04
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanciaCm?: number;

  // Nível calculado pelo ultrassônico
  @IsOptional()
  @IsNumber()
  @Min(0)
  nivelUltrassonicoCm?: number;

  // Nível calculado pelo sensor resistivo
  @IsOptional()
  @IsNumber()
  @Min(0)
  nivelResistivoCm?: number;

  // Umidade relativa do ar
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  umidadePct?: number;
}