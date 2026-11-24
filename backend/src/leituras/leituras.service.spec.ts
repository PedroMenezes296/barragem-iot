import { Test, TestingModule } from '@nestjs/testing';
import { LeiturasService } from './leituras.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeiturasGateway } from './leituras.gateway.js';
import { AlertasService } from '../alertas/alertas.service.js';
import { calculateLevel } from '../alertas/sensor-level.js';

const config = {
  idDispositivo: 'test-device',
  ativo: true,
  distanciaFundoCm: 5.75,
  secaCm: 0.5,
  atencaoCm: 2.5,
  inundacaoCm: 3.5,
  atualizadoEm: null,
  nivelMaximoConfiguravelCm: 3.75,
};

const input = {
  versao: 1,
  idDispositivo: 'test-device',
  idLeitura: 'test-reading',
  timestampRtc: '2026-11-18T12:00:00-03:00',
};
const saved = { ...input, id: 'saved-id', recebidoEm: new Date() };

describe('LeiturasService', () => {
  let service: LeiturasService;
  const create = vi.fn();
  const findMany = vi.fn();
  const notifyCreated = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeiturasService,
        { provide: PrismaService, useValue: { leitura: { create, findMany } } },
        { provide: LeiturasGateway, useValue: { notifyCreated } },
        {
          provide: AlertasService,
          useValue: {
            withConfiguration: (
              operation: (
                values: typeof config,
                received: Date,
              ) => Promise<unknown>,
            ) => operation(config, new Date()),
          },
        },
      ],
    }).compile();

    service = module.get<LeiturasService>(LeiturasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('emits only after persistence, preserving the HTTP response', async () => {
    let complete!: (value: typeof saved) => void;
    create.mockReturnValueOnce(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const result = service.create(input);
    expect(notifyCreated).not.toHaveBeenCalled();
    complete(saved);
    await expect(result).resolves.toEqual({
      mensagem: 'Leitura armazenada com sucesso!',
      leitura: saved,
    });
    expect(notifyCreated).toHaveBeenCalledExactlyOnceWith(saved.id);
  });

  it('does not emit when persistence fails', async () => {
    create.mockRejectedValueOnce(new Error('Persistence failed'));
    await expect(service.create(input)).rejects.toThrow('Persistence failed');
    expect(notifyCreated).not.toHaveBeenCalled();
  });

  it('ignores the legacy level and persists the backend calculation before notifying', async () => {
    create.mockImplementationOnce(({ data }) => ({
      ...data,
      id: 'calculated',
    }));
    const result = await service.create({
      ...input,
      distanciaCm: 4,
      nivelUltrassonicoCm: 99,
    });
    expect(result.leitura.nivelUltrassonicoCm).toBe(1.75);
    expect(notifyCreated).toHaveBeenCalledExactlyOnceWith('calculated');
  });

  it.each([
    [5.75, 0],
    [4, 1.75],
    [2, 3.75],
    [undefined, null],
    [null, null],
    [0, null],
    [1.99, null],
    [5.76, null],
    [401, null],
    [NaN, null],
    [Infinity, null],
  ])(
    'calculates distance %s as %s without replacing missing data by zero',
    (distance, expected) => {
      expect(calculateLevel(input.idDispositivo, distance, config)).toBe(
        expected,
      );
    },
  );

  it('uses a different reference, accepts 400 cm and does not require alarms to be enabled', () => {
    expect(
      calculateLevel(input.idDispositivo, 4, {
        ...config,
        distanciaFundoCm: 10,
        ativo: false,
      }),
    ).toBe(6);
    expect(
      calculateLevel(input.idDispositivo, 400, {
        ...config,
        distanciaFundoCm: 400,
      }),
    ).toBe(0);
    expect(
      calculateLevel(input.idDispositivo, 2, {
        ...config,
        distanciaFundoCm: 400,
      }),
    ).toBe(398);
    expect(
      calculateLevel(input.idDispositivo, 4, {
        ...config,
        distanciaFundoCm: null,
      }),
    ).toBeNull();
    expect(calculateLevel('other', 4, config)).toBeNull();
  });

  it('preserves the query and its ordering', async () => {
    findMany.mockResolvedValueOnce([saved]);
    await expect(service.findAll()).resolves.toEqual([saved]);
    expect(findMany).toHaveBeenCalledWith({ orderBy: { recebidoEm: 'desc' } });
  });
});
