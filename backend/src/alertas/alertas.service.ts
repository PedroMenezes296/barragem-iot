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
  input = plainToInstance(UpdateAlarmConfigDto, input);
  const errors = validateSync(input, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (
    errors.length ||
    input.distanciaFundoCm <= MIN_SENSOR_DISTANCE_CM ||
    input.alturaCheioCm > maximumLevel(input.distanciaFundoCm) ||
    !(input.secaPct < input.atencaoPct && input.atencaoPct < input.inundacaoPct)
  ) {
    throw new BadRequestException(
      'Informe referência maior que 2 e até 400 cm, altura de 100% maior que zero e até referência - 2 cm, e 0 <= seca < atenção < inundação <= 100%.',
    );
  }
}

export function classifyLevel(
  level: number,
  config: AlarmConfigDto,
): AlarmState {
  if (!config.ativo || config.distanciaFundoCm === null) return 'desativado';
  const percent = calculatePercentage(level, config.alturaCheioCm);
  const value = config.versao === 1 ? level : percent;
  const dry = config.versao === 1 ? config.secaCm : config.secaPct;
  const attention = config.versao === 1 ? config.atencaoCm : config.atencaoPct;
  const flood = config.versao === 1 ? config.inundacaoCm : config.inundacaoPct;
  if (value === null || dry === null || attention === null || flood === null)
    return 'sem_dados';
  if (value <= dry) return 'seca';
  if (value >= flood) return 'inundacao';
  if (value >= attention) return 'atencao';
  return 'normal';
}

@Injectable()
export class AlertasService implements OnModuleInit {
  private config: Pick<AlarmConfigDto, keyof AlarmConfigDto> = {
    versao: 2,
    alturaCheioCm: null,
    secaPct: 20,
    atencaoPct: 80,
    inundacaoPct: 95,
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
  private legacyOriginal: string | null = null;
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
      config: UpdateAlarmConfigDto & {
        versao?: number;
        secaCm?: number;
        atencaoCm?: number;
        inundacaoCm?: number;
      };
      atualizadoEm: string;
      referenciaDesde?: string;
    };
    if (!Number.isFinite(Date.parse(saved.atualizadoEm)))
      throw new Error('Data da configuração de alarmes inválida.');
    if (saved.config.versao !== 2) {
      this.legacyOriginal = raw;
      if (saved.config.versao !== undefined && saved.config.versao !== 1)
        throw new Error('Versão da configuração inválida.');
      const old = saved.config;
      const reference = old.distanciaFundoCm ?? 400;
      if (
        typeof old.ativo !== 'boolean' ||
        typeof old.idDispositivo !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(old.idDispositivo) ||
        ![reference, old.secaCm, old.atencaoCm, old.inundacaoCm].every(
          (value) =>
            typeof value === 'number' &&
            Number.isFinite(value) &&
            Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
        ) ||
        reference <= 2 ||
        reference > 400 ||
        old.secaCm! < 0 ||
        !(
          old.secaCm! < old.atencaoCm! &&
          old.atencaoCm! < old.inundacaoCm! &&
          old.inundacaoCm! <= maximumLevel(reference)
        )
      )
        throw new Error('Configuração legada inválida.');
      this.config = {
        ...this.config,
        versao: 1,
        idDispositivo: saved.config.idDispositivo,
        distanciaFundoCm: old.distanciaFundoCm ?? null,
        secaCm: old.secaCm!,
        atencaoCm: old.atencaoCm!,
        inundacaoCm: old.inundacaoCm!,
        atualizadoEm: saved.atualizadoEm,
        ativo: old.distanciaFundoCm != null && old.ativo,
        nivelMaximoConfiguravelCm:
          old.distanciaFundoCm == null ? null : maximumLevel(reference),
      };
    } else {
      const { versao: _version, ...values } = saved.config;
      validateLimits(values);
      this.config = {
        ...this.config,
        ...values,
        versao: 2,
        atualizadoEm: saved.atualizadoEm,
        nivelMaximoConfiguravelCm: maximumLevel(saved.config.distanciaFundoCm),
      };
    }
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
    input = plainToInstance(UpdateAlarmConfigDto, input);
    validateLimits(input);
    const values = {
      versao: 2,
      idDispositivo: input.idDispositivo,
      ativo: input.ativo,
      distanciaFundoCm: input.distanciaFundoCm,
      alturaCheioCm: input.alturaCheioCm,
      secaPct: input.secaPct,
      atencaoPct: input.atencaoPct,
      inundacaoPct: input.inundacaoPct,
    };
    return this.serialize(async () => {
      const atualizadoEm = this.nextTimestamp().toISOString();
      const changed =
        values.idDispositivo !== this.config.idDispositivo ||
        values.distanciaFundoCm !== this.config.distanciaFundoCm ||
        values.alturaCheioCm !== this.config.alturaCheioCm;
      const referenciaDesde = changed ? atualizadoEm : this.referenciaDesde;
      const target = `${this.file}.${randomUUID()}.tmp`;
      await mkdir(dirname(this.file), { recursive: true });
      if (this.legacyOriginal !== null) {
        try {
          await writeFile(`${this.file}.v1.json`, this.legacyOriginal, {
            encoding: 'utf8',
            flag: 'wx',
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        }
      }
      await writeFile(
        target,
        JSON.stringify({ config: values, atualizadoEm, referenciaDesde }),
        'utf8',
      );
      await rename(target, this.file);
      this.legacyOriginal = null;
      this.config = {
        ...values,
        secaCm: null,
        atencaoCm: null,
        inundacaoCm: null,
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
      percentualNivelPct: calculatePercentage(level, this.config.alturaCheioCm),
      alarmeAtivo: ['seca', 'atencao', 'inundacao'].includes(estado),
    };
  }
}
