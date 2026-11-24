import assert from "node:assert/strict";
import { parseAlarmDraft } from "../src/utils/alarm-form.ts";
import { currentAlarmStatus } from "../src/utils/alarm-status.ts";

const draft = {
  deviceId: "arduino-mega-01",
  enabled: true,
  reference: "5,75",
  dry: "0,50",
  attention: "2,5",
  flood: "3,50",
};
assert.deepEqual(parseAlarmDraft(draft), {
  idDispositivo: "arduino-mega-01",
  ativo: true,
  distanciaFundoCm: 5.75,
  secaCm: 0.5,
  atencaoCm: 2.5,
  inundacaoCm: 3.5,
});
for (const change of [
  { dry: "" },
  { dry: "-1" },
  { flood: "3,76" },
  { attention: "3,5" },
  { flood: "NaN" },
  { attention: "1e2" },
  { deviceId: "" },
  { reference: "" },
  { reference: "2" },
  { reference: "400,01" },
  { reference: "5,123" },
  { reference: "3" },
]) {
  assert.throws(() => parseAlarmDraft({ ...draft, ...change }));
}
assert.equal(parseAlarmDraft({ ...draft, reference: "12", flood: "10" }).inundacaoCm, 10);
assert.equal(parseAlarmDraft({ ...draft, reference: "10,2", flood: "8,2" }).inundacaoCm, 8.2);
const now = Date.now();
const fresh = {
  idDispositivo: "arduino-mega-01",
  estado: "seca",
  alarmeAtivo: true,
  nivelCm: 0,
  percentualNivelPct: 0,
  idLeitura: "test",
  recebidoEm: new Date(now).toISOString(),
};
assert.equal(currentAlarmStatus(fresh, now).nivelCm, 0);
assert.equal(currentAlarmStatus(fresh, now + 30_001).alarmeAtivo, false);
assert.equal(currentAlarmStatus(fresh, now + 30_001).estado, "desatualizado");
assert.equal(currentAlarmStatus(fresh, now + 30_001).percentualNivelPct, null);
assert.equal(currentAlarmStatus(null, now), null);
console.log(
  "Formulário de alarmes: vírgula decimal, validação, limites, zero e expiração: OK.",
);
