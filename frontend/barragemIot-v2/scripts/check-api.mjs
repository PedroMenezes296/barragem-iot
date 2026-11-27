import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { toReading, sortReadings } from "../src/services/reading-adapter.ts";
import { filterReadings, clampPage } from "../src/utils/history.ts";
import { leiturasControllerFindAll } from "../src/generated/api/leituras/leituras.ts";
import { appControllerGetHello } from "../src/generated/api/aplicação/aplicação.ts";
import { toForecast } from "../src/services/forecast-adapter.ts";

nextEnv.loadEnvConfig(process.cwd());
const spec = JSON.parse(
  await readFile(new URL("../openapi/backend.json", import.meta.url), "utf8"),
);
const schema = spec.components.schemas.LeituraResponseDto;
const dto = Object.fromEntries(
  Object.entries(schema.properties).map(([key, value]) => [key, value.example]),
);
const mapped = toReading({
  ...dto,
  distanciaCm: null,
  nivelResistivoCm: null,
  umidadePct: 0,
});
assert.equal(mapped.distanceCm, null);
assert.equal(mapped.resistiveLevelCm, null);
assert.equal(mapped.humidityPct, 0);
assert.equal(mapped.ultrasonicLevelCm, dto.nivelUltrassonicoCm);
assert.equal(mapped.readingId, dto.idLeitura);
assert.equal(mapped.deviceId, dto.idDispositivo);
assert.equal(mapped.timestamp, dto.recebidoEm);
assert.equal(mapped.rtcTimestamp, dto.timestampRtc);
assert.throws(() => toReading({ ...dto, timestampRtc: "invalid" }));
assert.throws(() => toReading({ ...dto, recebidoEm: "invalid" }));

// Um RTC atrasado nao pode colocar umidade antiga acima da nova leitura.
const oldTestReading = toReading({
  ...dto,
  id: "old-test",
  timestampRtc: "2026-10-27T00:00:00-03:00",
  recebidoEm: "2026-11-25T21:04:31Z",
  umidadePct: 0,
});
const recentReading = toReading({
  ...dto,
  id: "recent",
  timestampRtc: "2000-01-01T00:00:00-03:00",
  recebidoEm: "2026-11-25T21:05:49Z",
  umidadePct: 41,
});
const recentOrder = sortReadings([oldTestReading, recentReading]);
assert.equal(recentOrder[0].id, "recent");
assert.equal(recentOrder[0].humidityPct, 41);
assert.equal(recentOrder[0].rtcTimestamp, "2000-01-01T00:00:00-03:00");
assert.equal(
  sortReadings([oldTestReading, { ...recentReading, humidityPct: null }])[0]
    .humidityPct,
  null,
);
const afterOneDay = { ...recentReading, timestamp: "2026-11-27T21:05:49Z" };
assert.deepEqual(
  filterReadings(sortReadings([oldTestReading, afterOneDay]), "1").map(
    (row) => row.id,
  ),
  ["recent"],
);
const older = { ...mapped, id: "older", timestamp: "2026-10-01T12:00:00Z" };
const newer = { ...mapped, id: "newer", timestamp: "2026-10-03T12:00:00Z" };
const input = [older, newer];
const sorted = sortReadings(input);
assert.equal(input[0].id, "older");
assert.equal(sorted[0].id, "newer");
assert.equal(filterReadings(sorted, "1").length, 1);
assert.equal(filterReadings(sorted, "7").length, 2);
assert.equal(filterReadings([], "1").length, 0);
assert.equal(clampPage(5, 0, 10), 0);
assert.equal(clampPage(5, 12, 10), 1);

const weatherDto = {
  fonte: "Open-Meteo",
  localidade: "Cidade de teste",
  fusoHorario: "America/Sao_Paulo",
  consultadoEm: "2026-11-25T21:00:00Z",
  dias: Array.from({ length: 7 }, (_, index) => ({
    data: new Date(Date.UTC(2026, 10, 25 + index)).toISOString().slice(0, 10),
    precipitacaoMm: index === 1 ? null : index,
  })),
};
const weather = toForecast(weatherDto);
assert.equal(weather.days[0].date, "2026-11-25");
assert.equal(weather.days[0].precipitationMm, 0);
assert.equal(weather.days[1].precipitationMm, null);
assert.equal(weather.days[6].date, "2026-12-01");
assert.throws(() => toForecast({ ...weatherDto, dias: [] }));
assert.throws(() => toForecast({ ...weatherDto, fusoHorario: "Invalid/Zone" }));
assert.throws(() =>
  toForecast({
    ...weatherDto,
    dias: weatherDto.dias.map((day, i) =>
      i === 0 ? { ...day, precipitacaoMm: -1 } : day,
    ),
  }),
);
assert.throws(() =>
  toForecast({
    ...weatherDto,
    dias: weatherDto.dias.map((day, i) =>
      i === 1 ? { ...day, data: weatherDto.dias[0].data } : day,
    ),
  }),
);

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () =>
    Response.json(
      { statusCode: 500, message: "Internal server error" },
      { status: 500 },
    );
  assert.equal((await leiturasControllerFindAll()).status, 500);
  globalThis.fetch = async () => Response.json([]);
  assert.deepEqual((await leiturasControllerFindAll()).data, []);
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  "Mapeamento, nulos, zero, datas, ordenação, filtros, paginação e respostas vazia/500: OK.",
);

if (process.argv.includes("--live")) {
  const response = await leiturasControllerFindAll({
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.data));
  for (const row of response.data) {
    for (const key of schema.required)
      assert.ok(Object.hasOwn(row, key), `Campo ausente: ${key}`);
    for (const [key, property] of Object.entries(schema.properties)) {
      if (row[key] === null && property.nullable) continue;
      assert.equal(
        typeof row[key],
        property.type === "integer" ? "number" : property.type,
        `Tipo incorreto: ${key}`,
      );
    }
    toReading(row);
  }
  assert.equal(
    (await appControllerGetHello({ signal: AbortSignal.timeout(15_000) }))
      .status,
    200,
  );
  console.log(
    `Clientes gerados: GET / e GET /leituras HTTP 200; ${response.data.length} registros compatíveis com o Swagger.`,
  );
}
