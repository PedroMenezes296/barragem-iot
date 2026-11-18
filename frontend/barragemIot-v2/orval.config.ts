import { defineConfig } from "orval";

export default defineConfig({
  barragem: {
    input: { target: "./openapi/backend.json" },
    output: {
      target: "./src/generated/api/backend.ts",
      schemas: "./src/generated/api/models",
      client: "fetch",
      mode: "tags-split",
      baseUrl: {
        runtime: "getApiBaseUrl()",
        imports: [
          {
            name: "getApiBaseUrl",
            importPath: "@/lib/api-config",
            values: true,
          },
        ],
      },
      override: { fetch: { includeHttpResponseReturnType: true } },
    },
  },
});
