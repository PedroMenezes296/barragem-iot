import assert from "node:assert/strict";
import { parseAlarmDraft } from "../src/utils/alarm-form.ts";
import { currentAlarmStatus } from "../src/utils/alarm-status.ts";

const draft = {
  deviceId: "arduino-mega-01",
  enabled: true,
  dry: "0,50",
  attention: "2,5",
  flood: "3,50",
};
assert.deepEqual(parseAlarmDraft(draft, 3.75), {
  idDispositivo: "arduino-mega-01",
  ativo: true,
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
]) {
  assert.throws(() => parseAlarmDraft({ ...draft, ...change }, 3.75));
}
const now = Date.now();
const fresh = {
  estado: "seca",
  alarmeAtivo: true,
  nivelCm: 0,
  idLeitura: "test",
  recebidoEm: new Date(now).toISOString(),
};
assert.equal(currentAlarmStatus(fresh, now).nivelCm, 0);
assert.equal(currentAlarmStatus(fresh, now + 30_001).alarmeAtivo, false);
assert.equal(currentAlarmStatus(fresh, now + 30_001).estado, "desatualizado");
assert.equal(currentAlarmStatus(null, now), null);
console.log(
  "Formulário de alarmes: vírgula decimal, validação, limites, zero e expiração: OK.",
);
