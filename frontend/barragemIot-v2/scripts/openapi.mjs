import { mkdir, readFile, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import SwaggerParser from "@apidevtools/swagger-parser";

nextEnv.loadEnvConfig(process.cwd());
const target = new URL("../openapi/backend.json", import.meta.url);
if (process.argv.includes("--refresh")) {
  const base = (process.env.API_BASE_URL ?? "http://127.0.0.1:3000").replace(
    /\/+$/,
    "",
  );
  const source = process.env.OPENAPI_URL ?? `${base}/api/docs-json`;
  const response = await fetch(source, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`OpenAPI retornou HTTP ${response.status}`);
  const document = await response.json();
  await SwaggerParser.validate(structuredClone(document));
  await mkdir(new URL("../openapi/", import.meta.url), { recursive: true });
  await writeFile(target, JSON.stringify(document, null, 2) + "\n");
  console.log("OpenAPI atualizado do backend.");
}
const document = JSON.parse(await readFile(target, "utf8"));
await SwaggerParser.validate(structuredClone(document));
console.log(
  `OpenAPI ${document.openapi} válido: ${Object.keys(document.paths).length} caminhos.`,
);
