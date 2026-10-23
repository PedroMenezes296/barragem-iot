import { Test, TestingModule } from '@nestjs/testing';
import { LeiturasService } from './leituras.service.js';

describe('LeiturasService', () => {
  let service: LeiturasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeiturasService],
    }).compile();

    service = module.get<LeiturasService>(LeiturasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
