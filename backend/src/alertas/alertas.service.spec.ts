import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  AlertasService,
  classifyLevel,
  validateLimits,
} from './alertas.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { LeiturasGateway } from '../leituras/leituras.gateway.js';

describe('Alarm limits', () => {
  let directory: string;
  const findFirst = vi.fn();
  const notifyAlarmSettingsChanged = vi.fn();
  const input = {
    idDispositivo: 'test-device',
    ativo: true,
    distanciaFundoCm: 5.75,
    alturaCheioCm: 3.5,
    secaPct: 20,
    atencaoPct: 80,
    inundacaoPct: 95,
  };
  const makeService = () =>
    new AlertasService(
      { leitura: { findFirst } } as unknown as PrismaService,
      { notifyAlarmSettingsChanged } as unknown as LeiturasGateway,
    );

  beforeEach(async () => {
    vi.clearAllMocks();
    directory = await mkdtemp(join(tmpdir(), 'barragem-alarms-'));
    vi.stubEnv('ALARM_CONFIG_FILE', join(directory, 'config.json'));
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    if (resolve(dirname(directory)) !== resolve(tmpdir()))
      throw new Error('Unsafe temporary path');
    await rm(directory, { recursive: true, force: true });
  });

  it('starts disabled with no presumed limits', async () => {
    const service = makeService();
    await service.onModuleInit();
    expect(service.getConfig()).toMatchObject({
      ativo: false,
      secaCm: null,
      atencaoCm: null,
      inundacaoCm: null,
    });
    expect((await service.getStatus()).alarmeAtivo).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('persists and reloads the configuration before notifying browsers', async () => {
    const service = makeService();
    const result = await service.update(input);
    expect(
      JSON.parse(await readFile(join(directory, 'config.json'), 'utf8')).config,
    ).toEqual({ ...input, versao: 2 });
    const restarted = makeService();
    await restarted.onModuleInit();
    expect(restarted.getConfig()).toEqual(result);
    expect(notifyAlarmSettingsChanged).toHaveBeenCalledOnce();
  });

  it.each([
    { secaPct: -1 },
    { alturaCheioCm: 3.76 },
    { atencaoPct: 95 },
    { secaPct: 90 },
    { atencaoPct: NaN },
    { inundacaoPct: Infinity },
    { idDispositivo: '' },
    { distanciaFundoCm: 2 },
    { distanciaFundoCm: 400.01 },
    { distanciaFundoCm: 5.123 },
  ])('rejects invalid limits: %o', (change) => {
    expect(() => validateLimits({ ...input, ...change })).toThrow();
  });

  it('classifies exact boundaries and normal ranges', async () => {
    const config = await makeService().update(input);
    for (const [level, expected] of [
      [0, 'seca'],
      [0.7, 'seca'],
      [0.71, 'normal'],
      [2.79, 'normal'],
      [2.8, 'atencao'],
      [3.32, 'atencao'],
      [3.33, 'inundacao'],
      [3.75, 'inundacao'],
    ] as const) {
      expect(classifyLevel(level, config)).toBe(expected);
    }
  });

  it('uses the configured device, receipt freshness and never replaces null by zero', async () => {
    const service = makeService();
    await service.update(input);
    findFirst.mockResolvedValue({
      idLeitura: 'test',
      recebidoEm: new Date(Date.now() + 10),
      nivelUltrassonicoCm: 0,
    });
    expect(await service.getStatus()).toMatchObject({
      estado: 'seca',
      alarmeAtivo: true,
      nivelCm: 0,
      percentualNivelPct: 0,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { idDispositivo: 'test-device' },
      orderBy: { recebidoEm: 'desc' },
    });
    findFirst.mockResolvedValue({
      idLeitura: 'test',
      recebidoEm: new Date(Date.now() + 10),
      nivelUltrassonicoCm: null,
    });
    expect(await service.getStatus()).toMatchObject({
      estado: 'sem_dados',
      alarmeAtivo: false,
      percentualNivelPct: null,
    });
    findFirst.mockResolvedValue({
      idLeitura: 'test',
      recebidoEm: new Date(Date.now() + 10),
      nivelUltrassonicoCm: 3.5,
    });
    vi.spyOn(Date, 'now').mockReturnValueOnce(Date.now() + 31_000);
    expect(await service.getStatus()).toMatchObject({
      estado: 'desatualizado',
      alarmeAtivo: false,
      percentualNivelPct: null,
    });
  });

  it('loads legacy configuration disabled until a reference is explicitly saved', async () => {
    const legacy = {
      idDispositivo: input.idDispositivo,
      ativo: true,
      secaCm: 0.5,
      atencaoCm: 2.5,
      inundacaoCm: 3.5,
    };
    await writeFile(
      join(directory, 'config.json'),
      JSON.stringify({
        config: legacy,
        atualizadoEm: new Date().toISOString(),
      }),
    );
    const service = makeService();
    await service.onModuleInit();
    expect(service.getConfig()).toMatchObject({
      ativo: false,
      distanciaFundoCm: null,
      secaCm: 0.5,
      nivelMaximoConfiguravelCm: null,
    });
    expect((await service.getStatus()).alarmeAtivo).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
    expect((await service.update(input)).ativo).toBe(true);
  });

  it('never returns another device command or queries its reading', async () => {
    const service = makeService();
    await service.update(input);
    expect(await service.getStatus('other-device')).toMatchObject({
      idDispositivo: 'other-device',
      estado: 'desativado',
      alarmeAtivo: false,
      nivelCm: null,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('waits for a new reading after reference changes, including after restart', async () => {
    const service = makeService();
    await service.update(input);
    await service.withConfiguration(async (_config, recebidoEm) => {
      findFirst.mockResolvedValue({
        idLeitura: 'old-reference',
        recebidoEm,
        nivelUltrassonicoCm: 3.5,
      });
    });
    expect((await service.getStatus()).estado).toBe('inundacao');
    await service.update({ ...input, distanciaFundoCm: 10 });
    expect((await service.getStatus()).estado).toBe('sem_dados');
    const restarted = makeService();
    await restarted.onModuleInit();
    expect((await restarted.getStatus()).estado).toBe('sem_dados');
    await restarted.withConfiguration(async (_config, recebidoEm) => {
      findFirst.mockResolvedValue({
        idLeitura: 'new-reference',
        recebidoEm,
        nivelUltrassonicoCm: 6,
      });
    });
    expect((await restarted.getStatus()).estado).toBe('inundacao');
    await restarted.update({
      ...input,
      distanciaFundoCm: 10,
      alturaCheioCm: 7,
    });
    expect((await restarted.getStatus()).estado).toBe('sem_dados');
    await restarted.withConfiguration(async (_config, recebidoEm) => {
      findFirst.mockResolvedValue({
        idLeitura: 'full-reference',
        recebidoEm,
        nivelUltrassonicoCm: 6,
      });
    });
    expect((await restarted.getStatus()).estado).toBe('atencao');
    await restarted.update({
      ...input,
      distanciaFundoCm: 10,
      alturaCheioCm: 7,
      ativo: false,
    });
    expect((await restarted.getStatus()).estado).toBe('desativado');
  });

  it('serializes reference changes with in-flight persistence and recovers after failed writes', async () => {
    const service = makeService();
    await service.update(input);
    let complete!: () => void;
    const writing = service.withConfiguration(async (config, recebidoEm) => {
      expect(config.distanciaFundoCm).toBe(5.75);
      await new Promise<void>((resolve) => {
        complete = resolve;
      });
      findFirst.mockResolvedValue({
        idLeitura: 'in-flight',
        recebidoEm,
        nivelUltrassonicoCm: 3.5,
      });
    });
    await Promise.resolve();
    const updating = service.update({ ...input, distanciaFundoCm: 10 });
    expect(service.getConfig().distanciaFundoCm).toBe(5.75);
    complete();
    await writing;
    await updating;
    expect((await service.getStatus()).estado).toBe('sem_dados');
    await expect(
      service.withConfiguration(() =>
        Promise.reject(new Error('write failed')),
      ),
    ).rejects.toThrow('write failed');
    await expect(service.update(input)).resolves.toMatchObject({
      distanciaFundoCm: 5.75,
    });
  });

  it('preserves legacy cm alarms until conversion and keeps an original backup', async () => {
    const old = {
      idDispositivo: input.idDispositivo,
      ativo: true,
      distanciaFundoCm: 5.75,
      secaCm: 0.5,
      atencaoCm: 2.5,
      inundacaoCm: 3.5,
    };
    const raw = JSON.stringify({
      config: old,
      atualizadoEm: new Date(Date.now() - 1000).toISOString(),
    });
    await writeFile(join(directory, 'config.json'), raw);
    const service = makeService();
    await service.onModuleInit();
    expect(service.getConfig()).toMatchObject({
      versao: 1,
      alturaCheioCm: null,
      ativo: true,
    });
    findFirst.mockResolvedValue({
      idLeitura: 'legacy',
      recebidoEm: new Date(),
      nivelUltrassonicoCm: 2.5,
    });
    expect(await service.getStatus()).toMatchObject({
      estado: 'atencao',
      percentualNivelPct: null,
    });
    const converted = {
      ...input,
      secaPct: 14.29,
      atencaoPct: 71.43,
      inundacaoPct: 100,
    };
    expect(await service.update(converted)).toMatchObject({
      versao: 2,
      ...converted,
    });
    expect(await readFile(join(directory, 'config.json.v1.json'), 'utf8')).toBe(
      raw,
    );
    expect((await service.getStatus()).estado).toBe('sem_dados');
    const restarted = makeService();
    await restarted.onModuleInit();
    expect(restarted.getConfig()).toEqual(service.getConfig());
  });

  it('starts with 20/80/95 defaults and calculates percentage with alarms disabled', async () => {
    const service = makeService();
    expect(service.getConfig()).toMatchObject({
      versao: 2,
      alturaCheioCm: null,
      secaPct: 20,
      atencaoPct: 80,
      inundacaoPct: 95,
    });
    await service.update({ ...input, ativo: false });
    await service.withConfiguration(async (_config, recebidoEm) => {
      findFirst.mockResolvedValue({
        idLeitura: 'disabled',
        recebidoEm,
        nivelUltrassonicoCm: 2.8,
      });
    });
    expect(await service.getStatus()).toMatchObject({
      estado: 'desativado',
      alarmeAtivo: false,
      nivelCm: 2.8,
      percentualNivelPct: 80,
    });
    await service.update({ ...input, ativo: true, inundacaoPct: 96 });
    expect(await service.getStatus()).toMatchObject({
      estado: 'atencao',
      percentualNivelPct: 80,
    });
  });
});
