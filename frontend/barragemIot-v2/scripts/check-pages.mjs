import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const next = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
let stubStatus = 200;
let configOverride = {};
let statusOverride = {};
let weatherStatus = 200;
const stub = createServer((request, response) => {
  assert.equal(request.method, "GET");
  if (request.url === "/meteorologia/previsao") {
    response.writeHead(weatherStatus, { "Content-Type": "application/json" });
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    response.end(
      JSON.stringify(
        weatherStatus === 200
          ? {
              fonte: "Open-Meteo",
              localidade: "Cidade de teste",
              fusoHorario: "America/Sao_Paulo",
              consultadoEm: new Date().toISOString(),
              dias: Array.from({ length: 7 }, (_, i) => ({
                data: new Date(Date.parse(today + "T00:00:00Z") + i * 86400000)
                  .toISOString()
                  .slice(0, 10),
                precipitacaoMm: i === 1 ? null : i,
              })),
            }
          : { message: "Previsão temporariamente indisponível." },
      ),
    );
    return;
  }
  response.writeHead(stubStatus, { "Content-Type": "application/json" });
  if (stubStatus === 200 && request.url === "/alertas/configuracao") {
    response.end(
      JSON.stringify({
        versao: 2,
        alturaCheioCm: null,
        secaPct: 20,
        atencaoPct: 80,
        inundacaoPct: 95,
        idDispositivo: "arduino-mega-01",
        ativo: false,
        distanciaFundoCm: null,
        secaCm: null,
        atencaoCm: null,
        inundacaoCm: null,
        atualizadoEm: null,
        nivelMaximoConfiguravelCm: null,
        ...configOverride,
      }),
    );
    return;
  }
  if (stubStatus === 200 && request.url === "/alertas/estado") {
    response.end(
      JSON.stringify({
        idDispositivo: "arduino-mega-01",
        estado: "desativado",
        alarmeAtivo: false,
        nivelCm: null,
        percentualNivelPct: null,
        idLeitura: null,
        recebidoEm: null,
        ...statusOverride,
      }),
    );
    return;
  }
  response.end(
    JSON.stringify(
      stubStatus === 200
        ? []
        : { statusCode: 500, message: "Internal server error" },
    ),
  );
});
await new Promise((resolve) => stub.listen(0, "127.0.0.1", resolve));
const stubUrl = `http://127.0.0.1:${stub.address().port}`;

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function withFrontend(env, check) {
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [next, "start", "--port", String(port), "--hostname", "127.0.0.1"],
    {
      env: { ...process.env, ...env },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let log = "";
  child.stdout.on("data", (value) => {
    log += value;
  });
  child.stderr.on("data", (value) => {
    log += value;
  });
  async function page(route) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      signal: AbortSignal.timeout(20_000),
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(
      !html.includes("data-next-error-message"),
      "Erro de renderização do Next.js",
    );
    return html.replace(/<!--[\s\S]*?-->/g, "");
  }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(log);
      if (log.includes("Ready")) {
        ready = true;
        break;
      }
      await delay(200);
    }
    assert.ok(ready, log);
    await check(page);
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill();
      await exited;
    }
  }
}

try {
  await withFrontend({ DATA_SOURCE: "mock" }, async (page) => {
    await mkdir(".validation", { recursive: true });
    const home = await page("/");
    await writeFile(".validation/overview-after.html", home);
    assert.ok(home.includes("Modo demonstração"));
    assert.ok(home.includes("68%"));
    assert.ok(home.includes("Sistema online"));
    const history = await page("/historico");
    await writeFile(".validation/history-after.html", history);
    assert.ok(history.includes("LEIT-01842"));
    assert.ok(history.includes("BRG-DEV-001"));
    assert.ok(history.includes("Linhas:"));
    const alerts = await page("/alertas");
    await writeFile(".validation/alerts-after.html", alerts);
    assert.ok(alerts.includes("Receba alertas por e-mail"));
    assert.ok(alerts.includes("Limites dos alarmes"));
    assert.ok(alerts.includes("Limite de seca (%)"));
    assert.ok(
      alerts.includes("Distância do sensor ao fundo — reservatório vazio (cm)"),
    );
    assert.ok(alerts.includes("Nível máximo mensurável: 3,75 cm."));
    assert.ok(alerts.includes("Altura da água em 100% (cm)"));
    assert.ok(alerts.includes("Limite de atenção (%)"));
    assert.ok(alerts.includes("Limite de inundação (%)"));
    console.log(
      "Produção/mock: três páginas HTTP 200; indicadores, tabela e formulário preservados.",
    );
  });
  await withFrontend(
    { DATA_SOURCE: "api", API_BASE_URL: stubUrl },
    async (page) => {
      const alarms = await page("/alertas");
      assert.ok(alarms.includes("Salvar limites"));
      assert.ok(alarms.includes("Alarmes desativados"));
      const uncalibrated = await page("/");
      assert.ok(uncalibrated.includes("Configure a altura de 100%"));
      assert.ok(!uncalibrated.includes("68%"));
      assert.ok(uncalibrated.includes("Hoje e próximos 6 dias · Open-Meteo"));
      assert.ok(uncalibrated.includes("Cidade de teste"));
      assert.ok(uncalibrated.includes("Consultada em"));
      assert.ok(uncalibrated.includes("Dias sem previsão disponível"));
      weatherStatus = 503;
      const unavailableWeather = await page("/");
      assert.ok(
        unavailableWeather.includes("Previsão temporariamente indisponível"),
      );
      assert.ok(!unavailableWeather.includes("Próximos 7 dias · simulada"));
      weatherStatus = 200;
      for (const route of ["/", "/historico"]) {
        const html = await page(route);
        assert.ok(!html.includes("LEIT-01842"));
        assert.ok(!html.includes("Sistema online"));
        assert.ok(
          html.includes(
            route === "/" ? "Sem leituras" : "Nenhuma leitura encontrada",
          ),
        );
      }
      configOverride = { distanciaFundoCm: 120, alturaCheioCm: 100 };
      for (const percent of [0, 80, 95, 110]) {
        statusOverride = {
          estado: "desativado",
          alarmeAtivo: false,
          nivelCm: percent,
          percentualNivelPct: percent,
          idLeitura: "ui-test",
          recebidoEm: new Date().toISOString(),
        };
        const home = await page("/");
        assert.ok(
          home.includes(`${percent}%`),
          `Percentual real ausente: ${percent}`,
        );
        assert.ok(!home.includes("NÍVEL DEMONSTRATIVO"));
        assert.ok(!home.includes("Valor mockado"));
      }
      statusOverride = { estado: "desatualizado", percentualNivelPct: null };
      assert.ok(
        (await page("/")).includes(
          "Leitura desatualizada. Aguardando novos dados.",
        ),
      );
      configOverride = {
        versao: 1,
        secaCm: 0.5,
        atencaoCm: 2.5,
        inundacaoCm: 3.5,
      };
      const legacy = await page("/alertas");
      assert.ok(legacy.includes("Converter limites antigos para %"));
      assert.ok(legacy.includes("Configuração antiga em centímetros"));
      configOverride = {};
      statusOverride = {};
      stubStatus = 500;
      for (const route of ["/", "/historico"]) {
        const html = await page(route);
        assert.ok(html.includes("Verifique a disponibilidade da API"));
        assert.ok(!html.includes("LEIT-01842"));
      }
      console.log(
        "Produção/API controlada: lista vazia e HTTP 500 tratados sem fallback para mocks.",
      );
    },
  );
} finally {
  await new Promise((resolve) => stub.close(resolve));
}
