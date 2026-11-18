import 'reflect-metadata';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { io } from 'socket.io-client';
import { AlertasModule } from '../dist/alertas/alertas.module.js';
import { PrismaService } from '../dist/prisma/prisma.service.js';

const directory = await mkdtemp(join(tmpdir(), 'barragem-alarm-http-'));
assert.equal(
  resolve(dirname(directory)),
  resolve(tmpdir()),
  'Unsafe temporary path',
);
const previous = process.env.ALARM_CONFIG_FILE;
process.env.ALARM_CONFIG_FILE = join(directory, 'config.json');
let latest = null;
async function application() {
  const module = await Test.createTestingModule({ imports: [AlertasModule] })
    .overrideProvider(PrismaService)
    .useValue({ leitura: { findFirst: async () => latest } })
    .compile();
  const app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(0, '127.0.0.1');
  return app;
}
let app;
let socket;
try {
  app = await application();
  let url = await app.getUrl();
  let config = await (await fetch(`${url}/alertas/configuracao`)).json();
  assert.equal(config.ativo, false);
  assert.equal(config.secaCm, null);
  socket = io(url, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,
  });
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
  let notifications = 0;
  socket.on('alertas:configuracao', () => notifications++);
  const input = {
    idDispositivo: 'test-device',
    ativo: true,
    secaCm: 0.5,
    atencaoCm: 2.5,
    inundacaoCm: 3.5,
  };
  const put = (data) =>
    fetch(`${url}/alertas/configuracao`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  assert.equal((await put({ ...input, atencaoCm: 3.5 })).status, 400);
  assert.equal((await put({ ...input, inundacaoCm: 3.76 })).status, 400);
  assert.equal((await put({ ...input, unknown: true })).status, 400);
  assert.equal(notifications, 0);
  const response = await put(input);
  assert.equal(response.status, 200);
  config = await response.json();
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(notifications, 1);
  for (const [level, state] of [
    [0, 'seca'],
    [0.5, 'seca'],
    [1, 'normal'],
    [2.5, 'atencao'],
    [3.5, 'inundacao'],
    [3.75, 'inundacao'],
  ]) {
    latest = {
      idLeitura: 'test',
      recebidoEm: new Date(),
      nivelUltrassonicoCm: level,
    };
    const status = await (await fetch(`${url}/alertas/estado`)).json();
    assert.equal(status.estado, state);
    assert.equal(status.alarmeAtivo, state !== 'normal');
  }
  latest = {
    idLeitura: 'test',
    recebidoEm: new Date(),
    nivelUltrassonicoCm: null,
  };
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).estado,
    'sem_dados',
  );
  latest = {
    idLeitura: 'test',
    recebidoEm: new Date(Date.now() - 31_000),
    nivelUltrassonicoCm: 3.5,
  };
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).estado,
    'desatualizado',
  );
  socket.disconnect();
  await app.close();
  app = await application();
  url = await app.getUrl();
  assert.deepEqual(
    await (await fetch(`${url}/alertas/configuracao`)).json(),
    config,
  );
  assert.equal((await put({ ...input, ativo: false })).status, 200);
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).alarmeAtivo,
    false,
  );
  console.log(
    'Alarmes HTTP/WebSocket: validação, limites exatos, nulos, expiração, desativação e persistência após reinício: OK. Nenhuma gravação no MongoDB.',
  );
} finally {
  socket?.disconnect();
  await app?.close();
  if (previous === undefined) delete process.env.ALARM_CONFIG_FILE;
  else process.env.ALARM_CONFIG_FILE = previous;
  await rm(directory, { recursive: true, force: true });
}
