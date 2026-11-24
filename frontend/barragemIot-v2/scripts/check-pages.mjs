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
const stub = createServer((request, response) => {
  assert.equal(request.method, "GET");
  response.writeHead(stubStatus, { "Content-Type": "application/json" });
  if (stubStatus === 200 && request.url === "/alertas/configuracao") {
    response.end(
      JSON.stringify({
        idDispositivo: "arduino-mega-01",
        ativo: false,
        distanciaFundoCm: null,
        secaCm: null,
        atencaoCm: null,
        inundacaoCm: null,
        atualizadoEm: null,
        nivelMaximoConfiguravelCm: null,
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
    assert.ok(alerts.includes("Nível mínimo — seca (cm)"));
    assert.ok(alerts.includes("Distância do sensor ao fundo — reservatório vazio (cm)"));
    assert.ok(alerts.includes("Nível máximo mensurável: 3,75 cm."));
    assert.ok(alerts.includes("Nível de atenção (cm)"));
    assert.ok(alerts.includes("Nível máximo — inundação (cm)"));
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
