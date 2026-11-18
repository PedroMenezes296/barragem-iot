// Uses the production module with an in-memory Prisma replacement: no MongoDB writes.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { io } from 'socket.io-client';
import { LeiturasModule } from '../dist/leituras/leituras.module.js';
import { LeiturasGateway } from '../dist/leituras/leituras.gateway.js';
import { LeiturasService } from '../dist/leituras/leituras.service.js';
import { PrismaService } from '../dist/prisma/prisma.service.js';

const rows = [];
let failNext = false;
const prisma = {
  leitura: {
    async create({ data }) {
      if (failNext) {
        failNext = false;
        throw new Error('Test persistence failure');
      }
      const saved = {
        ...data,
        distanciaCm: data.distanciaCm ?? null,
        nivelUltrassonicoCm: data.nivelUltrassonicoCm ?? null,
        nivelResistivoCm: data.nivelResistivoCm ?? null,
        umidadePct: data.umidadePct ?? null,
        id: `test-${rows.length + 1}`,
        recebidoEm: new Date(),
      };
      rows.push(saved);
      return saved;
    },
    async findMany() {
      return [...rows].reverse();
    },
  },
};
const fixture = await Test.createTestingModule({ imports: [LeiturasModule] })
  .overrideProvider(PrismaService)
  .useValue(prisma)
  .compile();
const app = fixture.createNestApplication({ logger: false });
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
await app.listen(0, '127.0.0.1');
const url = await app.getUrl();
const gateway = app.get(LeiturasGateway);
const server = Reflect.get(gateway, 'server');
const input = {
  versao: 1,
  idDispositivo: 'realtime-test',
  idLeitura: 'initial-test',
  timestampRtc: '2026-11-18T12:00:00-03:00',
  distanciaCm: 35,
  umidadePct: 0,
};
const sockets = [];
function waitFor(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, done);
      reject(new Error(`Timeout: ${event}`));
    }, 5_000);
    function done(value) {
      clearTimeout(timer);
      resolve(value);
    }
    socket.once(event, done);
  });
}
async function connect(origin) {
  const socket = io(url, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,
    extraHeaders: { Origin: origin },
  });
  sockets.push(socket);
  const connected = waitFor(socket, 'connect');
  socket.connect();
  await connected;
  return socket;
}
async function post(body) {
  return fetch(`${url}/leituras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

try {
  const first = await connect('http://localhost:3001');
  const second = await connect('http://127.0.0.1:3001');
  assert.equal(first.io.engine.transport.name, 'websocket');
  const firstEvents = [],
    secondEvents = [];
  first.on('leitura:criada', (event) => firstEvents.push(event));
  second.on('leitura:criada', (event) => secondEvents.push(event));
  const events = Promise.all([
    waitFor(first, 'leitura:criada'),
    waitFor(second, 'leitura:criada'),
  ]);
  const response = await post(input);
  assert.equal(response.status, 201);
  const saved = (await response.json()).leitura;
  for (const event of await events) assert.deepEqual(event, { id: saved.id });
  const readings = await (await fetch(`${url}/leituras`)).json();
  assert.equal(readings[0].id, saved.id);
  failNext = true;
  assert.equal(
    (await post({ ...input, idLeitura: 'failed-test' })).status,
    500,
  );
  assert.equal((await post({ ...input, unknown: true })).status, 400);
  await delay(150);
  assert.equal(firstEvents.length, 1);
  assert.equal(secondEvents.length, 1);
  const denied = io(url, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,
    extraHeaders: { Origin: 'https://denied.example.com' },
  });
  sockets.push(denied);
  const refused = waitFor(denied, 'connect_error');
  denied.connect();
  await refused;
  assert.equal(denied.connected, false);
  for (const socket of sockets) socket.disconnect();
  console.log(
    'Gateway real: broadcast para dois clientes, POST/GET, falhas sem evento e origem recusada: OK.',
  );

  const clientScript = new URL(
    '../../frontend/barragemIot-v2/scripts/check-realtime.mjs',
    import.meta.url,
  );
  const loader = new URL(
    '../../frontend/barragemIot-v2/scripts/register-paths.mjs',
    import.meta.url,
  );
  const child = spawn(
    process.execPath,
    ['--import', loader.href, fileURLToPath(clientScript)],
    {
      env: { ...process.env, REALTIME_TEST_URL: url },
      windowsHide: true,
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    },
  );
  child.on('message', (message) => {
    if (message === 'disconnect-and-create') {
      for (const client of Object.values(server.engine.clients))
        client.close(true);
      void app
        .get(LeiturasService)
        .create({ ...input, idLeitura: 'while-disconnected' })
        .catch((error) => {
          console.error(error);
          child.kill();
        });
    }
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  assert.equal(exitCode, 0, 'Verificação do cliente frontend falhou');
  await delay(100);
  assert.equal(server.engine.clientsCount, 0, 'Conexões não encerradas');
  console.log('Integração backend/frontend verificada sem gravar no MongoDB.');
} finally {
  for (const socket of sockets) socket.disconnect();
  await app.close();
}
