import {
  BadRequestException,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeiturasGateway } from '../leituras/leituras.gateway.js';
import {
  AlarmConfigDto,
  AlarmStatusDto,
  MIN_SENSOR_DISTANCE_CM,
  UpdateAlarmConfigDto,
  type AlarmState,
} from './alertas.dto.js';
import { calculatePercentage, maximumLevel } from './sensor-level.js';

export function validateLimits(input: UpdateAlarmConfigDto): void {
  const errors = validateSync(plainToInstance(UpdateAlarmConfigDto, input), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (
    errors.length ||
    input.distanciaFundoCm <= MIN_SENSOR_DISTANCE_CM ||
    input.inundacaoCm > maximumLevel(input.distanciaFundoCm) ||
    !(input.secaCm < input.atencaoCm && input.atencaoCm < input.inundacaoCm)
  ) {
    throw new BadRequestException(
      'Informe referência maior que 2 e até 400 cm, dispositivo válido e 0 <= seca < atenção < inundação <= referência - 2 cm.',
    );
  }
}

export function classifyLevel(
  level: number,
  config: AlarmConfigDto,
): AlarmState {
  if (
    !config.ativo ||
    config.distanciaFundoCm === null ||
    config.secaCm === null ||
    config.atencaoCm === null ||
    config.inundacaoCm === null
  )
    return 'desativado';
  if (level <= config.secaCm) return 'seca';
  if (level >= config.inundacaoCm) return 'inundacao';
  if (level >= config.atencaoCm) return 'atencao';
  return 'normal';
}

@Injectable()
export class AlertasService implements OnModuleInit {
  private config: Pick<AlarmConfigDto, keyof AlarmConfigDto> = {
    idDispositivo: 'arduino-mega-01',
    ativo: false,
    distanciaFundoCm: null,
    secaCm: null,
    atencaoCm: null,
    inundacaoCm: null,
    atualizadoEm: null,
    nivelMaximoConfiguravelCm: null,
  };
  // Persistido no mesmo JSON: leituras anteriores a uma troca de referência
  // continuam no histórico, mas não podem comandar o alarme.
  private referenciaDesde: string | null = null;
  private lastTimestamp = 0;
  private pending: Promise<void> = Promise.resolve();
  private readonly file = resolve(
    process.env.ALARM_CONFIG_FILE ?? '.data/alertas.json',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: LeiturasGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    let raw: string;
    try {
      raw = await readFile(this.file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    const saved = JSON.parse(raw) as {
      config: Pick<UpdateAlarmConfigDto, keyof UpdateAlarmConfigDto>;
      atualizadoEm: string;
      referenciaDesde?: string;
    };
    if (!Number.isFinite(Date.parse(saved.atualizadoEm)))
      throw new Error('Data da configuração de alarmes inválida.');
    if (saved.config.distanciaFundoCm == null) {
      validateLimits({ ...saved.config, distanciaFundoCm: 400 });
      this.config = {
        ...this.config,
        idDispositivo: saved.config.idDispositivo,
        secaCm: saved.config.secaCm,
        atencaoCm: saved.config.atencaoCm,
        inundacaoCm: saved.config.inundacaoCm,
        atualizadoEm: saved.atualizadoEm,
        ativo: false,
      };
      return;
    }
    validateLimits(saved.config);
    this.config = {
      ...saved.config,
      atualizadoEm: saved.atualizadoEm,
      nivelMaximoConfiguravelCm: maximumLevel(saved.config.distanciaFundoCm),
    };
    this.referenciaDesde = saved.referenciaDesde ?? saved.atualizadoEm;
    if (!Number.isFinite(Date.parse(this.referenciaDesde)))
      throw new Error('Data da referência de nível inválida.');
    this.lastTimestamp = Math.max(
      Date.parse(saved.atualizadoEm),
      Date.parse(this.referenciaDesde),
    );
  }

  getConfig(): AlarmConfigDto {
    return { ...this.config };
  }

  private nextTimestamp(): Date {
    this.lastTimestamp = Math.max(Date.now(), this.lastTimestamp + 1);
    return new Date(this.lastTimestamp);
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  // Serializa a persistência com a troca de referência para que uma leitura
  // em andamento nunca pareça ter sido calculada sob a referência nova.
  withConfiguration<T>(
    operation: (config: AlarmConfigDto, recebidoEm: Date) => Promise<T>,
  ): Promise<T> {
    return this.serialize(() =>
      operation(this.getConfig(), this.nextTimestamp()),
    );
  }

  update(input: UpdateAlarmConfigDto): Promise<AlarmConfigDto> {
    validateLimits(input);
    const values = {
      idDispositivo: input.idDispositivo,
      ativo: input.ativo,
      distanciaFundoCm: input.distanciaFundoCm,
      secaCm: input.secaCm,
      atencaoCm: input.atencaoCm,
      inundacaoCm: input.inundacaoCm,
    };
    return this.serialize(async () => {
      const atualizadoEm = this.nextTimestamp().toISOString();
      const changed =
        values.idDispositivo !== this.config.idDispositivo ||
        values.distanciaFundoCm !== this.config.distanciaFundoCm;
      const referenciaDesde = changed ? atualizadoEm : this.referenciaDesde;
      const target = `${this.file}.${randomUUID()}.tmp`;
      await mkdir(dirname(this.file), { recursive: true });
      await writeFile(
        target,
        JSON.stringify({ config: values, atualizadoEm, referenciaDesde }),
        'utf8',
      );
      await rename(target, this.file);
      this.config = {
        ...values,
        atualizadoEm,
        nivelMaximoConfiguravelCm: maximumLevel(values.distanciaFundoCm),
      };
      this.referenciaDesde = referenciaDesde;
      this.realtime.notifyAlarmSettingsChanged();
      return this.getConfig();
    });
  }

  getStatus(idDispositivo?: string): Promise<AlarmStatusDto> {
    return this.serialize(() => this.evaluateStatus(idDispositivo));
  }

  private async evaluateStatus(
    idDispositivo?: string,
  ): Promise<AlarmStatusDto> {
    const empty: Pick<AlarmStatusDto, keyof AlarmStatusDto> = {
      idDispositivo: idDispositivo ?? this.config.idDispositivo,
      estado: 'desativado',
      alarmeAtivo: false,
      nivelCm: null,
      percentualNivelPct: null,
      idLeitura: null,
      recebidoEm: null,
    };
    if (
      !this.config.ativo ||
      this.config.distanciaFundoCm === null ||
      (idDispositivo !== undefined &&
        idDispositivo !== this.config.idDispositivo)
    )
      return empty;
    const latest = await this.prisma.leitura.findFirst({
      where: { idDispositivo: this.config.idDispositivo },
      orderBy: { recebidoEm: 'desc' },
    });
    if (!latest) return { ...empty, estado: 'sem_dados' };
    const info = {
      ...empty,
      idLeitura: latest.idLeitura,
      recebidoEm: latest.recebidoEm.toISOString(),
    };
    if (
      this.referenciaDesde === null ||
      latest.recebidoEm.getTime() <= Date.parse(this.referenciaDesde)
    )
      return { ...info, estado: 'sem_dados' };
    const age = Date.now() - latest.recebidoEm.getTime();
    if (age > 30_000 || age < -5_000)
      return { ...info, estado: 'desatualizado' };
    const level = latest.nivelUltrassonicoCm;
    if (
      level === null ||
      !Number.isFinite(level) ||
      level < 0 ||
      level > maximumLevel(this.config.distanciaFundoCm)
    )
      return { ...info, estado: 'sem_dados' };
    const estado = classifyLevel(level, this.config);
    return {
      ...info,
      estado,
      nivelCm: level,
      percentualNivelPct: calculatePercentage(level, this.config.inundacaoCm),
      alarmeAtivo: ['seca', 'atencao', 'inundacao'].includes(estado),
    };
  }
}
