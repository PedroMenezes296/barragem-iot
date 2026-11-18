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
  MAX_LEVEL_CM,
  UpdateAlarmConfigDto,
  type AlarmState,
} from './alertas.dto.js';

export function validateLimits(input: UpdateAlarmConfigDto): void {
  const errors = validateSync(plainToInstance(UpdateAlarmConfigDto, input), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (
    errors.length ||
    !(input.secaCm < input.atencaoCm && input.atencaoCm < input.inundacaoCm)
  ) {
    throw new BadRequestException(
      `Use números entre 0 e ${MAX_LEVEL_CM} cm e seca < atenção < inundação; informe um dispositivo válido.`,
    );
  }
}

export function classifyLevel(
  level: number,
  config: AlarmConfigDto,
): AlarmState {
  if (
    !config.ativo ||
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
    secaCm: null,
    atencaoCm: null,
    inundacaoCm: null,
    atualizadoEm: null,
    nivelMaximoConfiguravelCm: MAX_LEVEL_CM,
  };
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
    };
    validateLimits(saved.config);
    if (!Number.isFinite(Date.parse(saved.atualizadoEm)))
      throw new Error('Data da configuração de alarmes inválida.');
    this.config = {
      ...saved.config,
      atualizadoEm: saved.atualizadoEm,
      nivelMaximoConfiguravelCm: MAX_LEVEL_CM,
    };
  }

  getConfig(): AlarmConfigDto {
    return { ...this.config };
  }

  update(input: UpdateAlarmConfigDto): Promise<AlarmConfigDto> {
    validateLimits(input);
    const values = {
      idDispositivo: input.idDispositivo,
      ativo: input.ativo,
      secaCm: input.secaCm,
      atencaoCm: input.atencaoCm,
      inundacaoCm: input.inundacaoCm,
    };
    const operation = this.pending.then(async () => {
      const atualizadoEm = new Date().toISOString();
      const target = `${this.file}.${randomUUID()}.tmp`;
      await mkdir(dirname(this.file), { recursive: true });
      await writeFile(
        target,
        JSON.stringify({ config: values, atualizadoEm }),
        'utf8',
      );
      await rename(target, this.file);
      this.config = {
        ...values,
        atualizadoEm,
        nivelMaximoConfiguravelCm: MAX_LEVEL_CM,
      };
      this.realtime.notifyAlarmSettingsChanged();
      return this.getConfig();
    });
    this.pending = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  async getStatus(): Promise<AlarmStatusDto> {
    const empty: Pick<AlarmStatusDto, keyof AlarmStatusDto> = {
      estado: 'desativado',
      alarmeAtivo: false,
      nivelCm: null,
      idLeitura: null,
      recebidoEm: null,
    };
    if (!this.config.ativo) return empty;
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
    const age = Date.now() - latest.recebidoEm.getTime();
    if (age > 30_000 || age < -5_000)
      return { ...info, estado: 'desatualizado' };
    const level = latest.nivelUltrassonicoCm;
    if (
      level === null ||
      !Number.isFinite(level) ||
      level < 0 ||
      level > MAX_LEVEL_CM
    )
      return { ...info, estado: 'sem_dados' };
    const estado = classifyLevel(level, this.config);
    return {
      ...info,
      estado,
      nivelCm: level,
      alarmeAtivo: ['seca', 'atencao', 'inundacao'].includes(estado),
    };
  }
}
