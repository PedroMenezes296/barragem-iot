import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { toReading, sortReadings } from "../src/services/reading-adapter.ts";
import { filterReadings, clampPage } from "../src/utils/history.ts";
import { leiturasControllerFindAll } from "../src/generated/api/leituras/leituras.ts";
import { appControllerGetHello } from "../src/generated/api/aplicação/aplicação.ts";

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
assert.throws(() => toReading({ ...dto, timestampRtc: "invalid" }));
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
