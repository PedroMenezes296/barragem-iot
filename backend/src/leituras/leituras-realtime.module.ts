import { Module } from '@nestjs/common';
import { LeiturasGateway } from './leituras.gateway.js';

@Module({ providers: [LeiturasGateway], exports: [LeiturasGateway] })
export class LeiturasRealtimeModule {}
