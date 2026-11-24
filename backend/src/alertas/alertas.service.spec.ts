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
    secaCm: 0.5,
    atencaoCm: 2.5,
    inundacaoCm: 3.5,
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
    ).toEqual(input);
    const restarted = makeService();
    await restarted.onModuleInit();
    expect(restarted.getConfig()).toEqual(result);
    expect(notifyAlarmSettingsChanged).toHaveBeenCalledOnce();
  });

  it.each([
    { secaCm: -1 },
    { inundacaoCm: 3.76 },
    { atencaoCm: 3.5 },
    { secaCm: 3 },
    { atencaoCm: NaN },
    { inundacaoCm: Infinity },
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
      [0.5, 'seca'],
      [0.51, 'normal'],
      [2.49, 'normal'],
      [2.5, 'atencao'],
      [3.49, 'atencao'],
      [3.5, 'inundacao'],
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
    const { distanciaFundoCm: _reference, ...legacy } = input;
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
    await restarted.update({ ...input, distanciaFundoCm: 10, inundacaoCm: 7 });
    expect((await restarted.getStatus()).estado).toBe('atencao');
    await restarted.update({ ...input, distanciaFundoCm: 10, ativo: false });
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
});
