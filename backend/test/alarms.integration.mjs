import 'reflect-metadata';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { io } from 'socket.io-client';
import { AlertasModule } from '../dist/alertas/alertas.module.js';
import { LeiturasModule } from '../dist/leituras/leituras.module.js';
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
const rows = [];
async function application() {
  const module = await Test.createTestingModule({
    imports: [AlertasModule, LeiturasModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      leitura: {
        findFirst: async ({ where }) => rows.findLast((row) => row.idDispositivo === where.idDispositivo) ?? null,
        findMany: async () => [...rows].reverse(),
        create: async ({ data }) => {
          latest = { ...data, id: `test-${rows.length}` };
          rows.push(latest);
          return latest;
        },
      },
    })
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
    distanciaFundoCm: 5.75,
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
  const post = async (distance, extra = {}) => {
    const response = await fetch(`${url}/leituras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versao: 1,
        idDispositivo: 'test-device',
        idLeitura: `reading-${rows.length}`,
        timestampRtc: '2026-11-18T12:00:00-03:00',
        distanciaCm: distance,
        ...extra,
      }),
    });
    assert.equal(response.status, 201);
    return (await response.json()).leitura;
  };
  assert.equal(
    (await post(4, { nivelUltrassonicoCm: 99 })).nivelUltrassonicoCm,
    null,
  );
  assert.equal((await put({ ...input, atencaoCm: 3.5 })).status, 400);
  assert.equal((await put({ ...input, inundacaoCm: 3.76 })).status, 400);
  assert.equal((await put({ ...input, unknown: true })).status, 400);
  assert.equal((await put({ ...input, distanciaFundoCm: 2 })).status, 400);
  assert.equal((await put({ ...input, distanciaFundoCm: 401 })).status, 400);
  assert.equal(
    (await put({ ...input, distanciaFundoCm: undefined })).status,
    400,
  );
  assert.equal(notifications, 0);
  const response = await put(input);
  assert.equal(response.status, 200);
  config = await response.json();
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(notifications, 1);
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).estado,
    'sem_dados',
  );
  for (const [level, state] of [
    [0, 'seca'],
    [0.5, 'seca'],
    [1, 'normal'],
    [1.75, 'normal'],
    [2.5, 'atencao'],
    [3.5, 'inundacao'],
    [3.75, 'inundacao'],
  ]) {
    const created = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout leitura:criada')), 5000);
      socket.once('leitura:criada', (event) => { clearTimeout(timer); resolve(event); });
    });
    const saved = await post(5.75 - level, { nivelUltrassonicoCm: 99 });
    assert.deepEqual(await created, { id: saved.id });
    assert.equal(saved.nivelUltrassonicoCm, level);
    assert.equal((await (await fetch(`${url}/leituras`)).json())[0].nivelUltrassonicoCm, level);
    const status = await (await fetch(`${url}/alertas/estado`)).json();
    assert.equal(status.estado, state);
    assert.equal(status.percentualNivelPct, Number((level / input.inundacaoCm * 100).toFixed(2)));
    assert.equal(status.alarmeAtivo, state !== 'normal');
  }
  for (const distance of [undefined, null, 0, 1.99, 5.76, 401]) {
    assert.equal((await post(distance)).nivelUltrassonicoCm, null);
    assert.equal(
      (await (await fetch(`${url}/alertas/estado`)).json()).estado,
      'sem_dados',
    );
  }
  await post(2.25);
  const other = await (
    await fetch(`${url}/alertas/estado?idDispositivo=other-device`)
  ).json();
  assert.equal(other.idDispositivo, 'other-device');
  assert.equal(other.alarmeAtivo, false);
  assert.equal(other.percentualNivelPct, null);
  assert.equal(other.estado, 'desativado');
  assert.equal(
    (await fetch(`${url}/alertas/estado?idDispositivo=invalid!`)).status,
    400,
  );
  const oldRow = latest;
  assert.equal(
    (await put({ ...input, distanciaFundoCm: 10.2, inundacaoCm: 8.2 })).status,
    200,
  );
  config = await (await fetch(`${url}/alertas/configuracao`)).json();
  assert.equal(config.nivelMaximoConfiguravelCm, 8.2);
  assert.equal(oldRow.nivelUltrassonicoCm, 3.5);
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).estado,
    'sem_dados',
  );
  socket.disconnect();
  await app.close();
  app = await application();
  url = await app.getUrl();
  assert.deepEqual(
    await (await fetch(`${url}/alertas/configuracao`)).json(),
    config,
  );
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).estado,
    'sem_dados',
  );
  assert.equal((await post(4)).nivelUltrassonicoCm, 6.2);
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).estado,
    'atencao',
  );
  latest.recebidoEm = new Date(Date.now() - 31_000);
  const savedConfig = JSON.parse(
    await readFile(process.env.ALARM_CONFIG_FILE, 'utf8'),
  );
  savedConfig.referenciaDesde = new Date(Date.now() - 60_000).toISOString();
  await writeFile(process.env.ALARM_CONFIG_FILE, JSON.stringify(savedConfig));
  await app.close();
  app = await application();
  url = await app.getUrl();
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
  assert.equal((await post(4)).nivelUltrassonicoCm, 1.75);
  assert.equal((await post(4, { idDispositivo: 'another-device' })).nivelUltrassonicoCm, null);
  assert.equal(
    (await (await fetch(`${url}/alertas/estado`)).json()).alarmeAtivo,
    false,
  );
  console.log(
    'Alarmes HTTP/WebSocket: cálculo no backend, legado ignorado, zero/nulos/faixa, limites exatos, dispositivo, troca de referência, histórico, expiração, desativação e persistência após reinício: OK. Nenhuma gravação no MongoDB.',
  );
} finally {
  socket?.disconnect();
  await app?.close();
  if (previous === undefined) delete process.env.ALARM_CONFIG_FILE;
  else process.env.ALARM_CONFIG_FILE = previous;
  await rm(directory, { recursive: true, force: true });
}
