import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MeteorologiaService } from './meteorologia.service.js';
import { ForecastResponseDto } from './meteorologia.dto.js';

@ApiTags('Meteorologia')
@Controller('meteorologia')
export class MeteorologiaController {
  constructor(private readonly service: MeteorologiaService) {}

  @Get('previsao')
  @ApiOperation({
    summary:
      'Previsão de precipitação para hoje e os próximos seis dias; consulta atualizada a cada 15 minutos e na mudança do dia local.',
  })
  @ApiOkResponse({ type: ForecastResponseDto })
  @ApiServiceUnavailableResponse({
    description:
      'Localização não configurada ou previsão temporariamente indisponível.',
  })
  getForecast() {
    return this.service.getForecast();
  }
}
