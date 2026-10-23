import { Test, TestingModule } from '@nestjs/testing';
import { LeiturasController } from './leituras.controller.js';
import { LeiturasService } from './leituras.service.js';

describe('LeiturasController', () => {
  let controller: LeiturasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeiturasController],
      providers: [LeiturasService],
    }).compile();

    controller = module.get<LeiturasController>(LeiturasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
