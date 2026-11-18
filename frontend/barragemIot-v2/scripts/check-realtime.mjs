// Run by the backend fixture, never against the real database.
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { subscribeToReadings } from "../src/lib/readings-socket.ts";

const url = process.env.REALTIME_TEST_URL;
assert.ok(url && process.send, "Execute pelo teste de integração do backend.");
let refreshes = 0;
let connections = 0;
let rows = [];
let lastError;
let disconnected = false;
async function until(predicate) {
  for (let i = 0; i < 400; i++) {
    if (lastError) throw lastError;
    if (predicate()) return;
    await delay(20);
  }
  throw new Error("Timeout na atualização em tempo real");
}
let stop = subscribeToReadings(url, {
  onStatus(status) {
    if (status === "connected") connections++;
    if (status === "disconnected") disconnected = true;
  },
  onRefresh() {
    refreshes++;
    void fetch(`${url}/leituras`)
      .then((response) => response.json())
      .then((value) => {
        rows = value;
      })
      .catch((error) => {
        lastError = error;
      });
  },
});
async function post(id) {
  const response = await fetch(`${url}/leituras`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      versao: 1,
      idDispositivo: "frontend-test",
      idLeitura: id,
      timestampRtc: "2026-11-18T12:00:00-03:00",
    }),
  });
  assert.equal(response.status, 201);
}
try {
  await until(() => connections === 1 && rows.length > 0);
  const before = refreshes;
  const count = rows.length;
  await Promise.all([post("burst-1"), post("burst-2"), post("burst-3")]);
  await until(() => rows.length === count + 3);
  await delay(350);
  assert.equal(
    refreshes,
    before + 1,
    "Rajada deve gerar uma única atualização",
  );
  process.send("disconnect-and-create");
  await until(
    () =>
      disconnected &&
      connections === 2 &&
      rows.some((row) => row.idLeitura === "while-disconnected"),
  );
  const beforeCleanup = refreshes;
  await post("cleanup");
  stop();
  stop = () => {};
  await delay(500);
  assert.equal(
    refreshes,
    beforeCleanup,
    "Atualização pendente deve ser cancelada ao desmontar",
  );
  console.log(
    "Cliente frontend real: sincronização inicial, rajada, reconexão, recuperação e cleanup: OK.",
  );
} finally {
  stop();
  process.disconnect();
}
