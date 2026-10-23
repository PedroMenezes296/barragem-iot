import { PartialType } from '@nestjs/mapped-types';
import { CreateLeituraDto } from './create-leitura.dto.js';

export class UpdateLeituraDto extends PartialType(CreateLeituraDto) {}
