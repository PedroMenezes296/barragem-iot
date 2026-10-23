import { Injectable } from '@nestjs/common';
import { CreateLeituraDto } from './dto/create-leitura.dto.js';
import { UpdateLeituraDto } from './dto/update-leitura.dto.js';

@Injectable()
export class LeiturasService {
  create(createLeituraDto: CreateLeituraDto) {
    return 'This action adds a new leitura';
  }

  findAll() {
    return `This action returns all leituras`;
  }

  findOne(id: number) {
    return `This action returns a #${id} leitura`;
  }

  update(id: number, updateLeituraDto: UpdateLeituraDto) {
    return `This action updates a #${id} leitura`;
  }

  remove(id: number) {
    return `This action removes a #${id} leitura`;
  }
}
