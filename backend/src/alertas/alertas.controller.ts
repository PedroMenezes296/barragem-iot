import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AlertasService } from './alertas.service.js';
import {
  AlarmConfigDto,
  AlarmStatusDto,
  AlarmStatusQueryDto,
  UpdateAlarmConfigDto,
} from './alertas.dto.js';

@ApiTags('Alertas')
@Controller('alertas')
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get('configuracao')
  @ApiOperation({
    summary: 'Consultar limites persistidos dos alarmes da maquete',
  })
  @ApiOkResponse({ type: AlarmConfigDto })
  getConfig() {
    return this.service.getConfig();
  }

  @Put('configuracao')
  @ApiOperation({
    summary:
      'Salvar referência e limites; exige seca < atenção < inundação <= distanciaFundoCm - 2',
  })
  @ApiOkResponse({ type: AlarmConfigDto })
  @ApiBadRequestResponse({ description: 'Limites ou dispositivo inválidos.' })
  update(@Body() input: UpdateAlarmConfigDto) {
    return this.service.update(input);
  }

  @Get('estado')
  @ApiOperation({
    summary:
      'Avaliar a última leitura recebida do dispositivo configurado; expira após 30 segundos',
  })
  @ApiOkResponse({ type: AlarmStatusDto })
  getStatus(@Query() query: AlarmStatusQueryDto) {
    return this.service.getStatus(query.idDispositivo);
  }
}
