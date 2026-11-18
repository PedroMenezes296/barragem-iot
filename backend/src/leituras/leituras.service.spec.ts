import { Test, TestingModule } from '@nestjs/testing';
import { LeiturasService } from './leituras.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeiturasGateway } from './leituras.gateway.js';

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

  it('preserves the query and its ordering', async () => {
    findMany.mockResolvedValueOnce([saved]);
    await expect(service.findAll()).resolves.toEqual([saved]);
    expect(findMany).toHaveBeenCalledWith({ orderBy: { recebidoEm: 'desc' } });
  });
});
