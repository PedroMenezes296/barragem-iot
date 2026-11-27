import assert from "node:assert/strict";
import {
  parseAlarmDraft,
  convertLegacyLimits,
} from "../src/utils/alarm-form.ts";
import { currentAlarmStatus } from "../src/utils/alarm-status.ts";
const draft = {
  deviceId: "arduino-mega-01",
  enabled: true,
  reference: "5,75",
  full: "3,50",
  dry: "20",
  attention: "80",
  flood: "95",
};
assert.deepEqual(parseAlarmDraft(draft), {
  idDispositivo: "arduino-mega-01",
  ativo: true,
  distanciaFundoCm: 5.75,
  alturaCheioCm: 3.5,
  secaPct: 20,
  atencaoPct: 80,
  inundacaoPct: 95,
});
for (const change of [
  { dry: "" },
  { dry: "-1" },
  { flood: "100,01" },
  { attention: "95" },
  { flood: "NaN" },
  { attention: "1e2" },
  { deviceId: "" },
  { reference: "" },
  { reference: "2" },
  { reference: "400,01" },
  { reference: "5,123" },
  { reference: "3" },
  { full: "" },
  { full: "0" },
  { full: "3,76" },
])
  assert.throws(() => parseAlarmDraft({ ...draft, ...change }));
assert.equal(
  parseAlarmDraft({ ...draft, reference: "10,2", full: "8,2" }).alturaCheioCm,
  8.2,
);
const old = { secaCm: 0.5, atencaoCm: 2.5, inundacaoCm: 3.5 };
assert.deepEqual(convertLegacyLimits("3,5", old), {
  dry: "14.29",
  attention: "71.43",
  flood: "100",
});
assert.deepEqual(convertLegacyLimits("5", old), {
  dry: "10",
  attention: "50",
  flood: "70",
});
assert.throws(() => convertLegacyLimits("3", old));
assert.throws(() => convertLegacyLimits("", old));
assert.throws(() =>
  convertLegacyLimits("100", {
    secaCm: 0.001,
    atencaoCm: 0.002,
    inundacaoCm: 1,
  }),
);
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
assert.equal(
  currentAlarmStatus(
    {
      ...fresh,
      estado: "desativado",
      alarmeAtivo: false,
      percentualNivelPct: 80,
    },
    now,
  ).percentualNivelPct,
  80,
);
assert.equal(
  currentAlarmStatus(
    { ...fresh, estado: "desativado", alarmeAtivo: false },
    now + 30_001,
  ).percentualNivelPct,
  null,
);
assert.equal(currentAlarmStatus(null, now), null);
console.log(
  "Alarmes percentuais: referências, limites, conversão legada, zero e expiração: OK.",
);
