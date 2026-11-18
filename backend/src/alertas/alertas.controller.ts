import { Body, Controller, Get, Put } from '@nestjs/common';
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
    summary: 'Salvar limites; exige seca < atenção < inundação, em cm de água',
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
  getStatus() {
    return this.service.getStatus();
  }
}
