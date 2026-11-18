# BarragemIot

Dashboard responsivo com Next.js App Router, React, TypeScript, Material UI e MUI X Charts. Leituras vêm da API por padrão; percentual, previsão e alertas continuam demonstrativos.

## Executar localmente

```bash
npm ci
cp .env.example .env.local
npm run dev -- --port 3001
```

Use Node.js 24 (ambiente validado). No PowerShell, copie o exemplo com `Copy-Item .env.example .env.local`. Abra [http://localhost:3001](http://localhost:3001); o backend ocupa a porta 3000. Para produção, use `npm run build` e `npm start -- --port 3001`.

`API_BASE_URL` configura o backend e `OPENAPI_URL` configura seu documento JSON. São variáveis de servidor, sem prefixo `NEXT_PUBLIC_`. `DATA_SOURCE=api` é o padrão; `DATA_SOURCE=mock` restaura a demonstração original. Reinicie o processo após alterar o ambiente. As chamadas acontecem no servidor Next.js, sem cache e com timeout, sem exigir alteração de CORS no backend.

## Páginas

- `/` — visão geral com níveis e umidade da API, percentual ilustrativo e chuva simulada.
- `/historico` — leituras da API com filtro de período e paginação locais.
- `/alertas` — eventos simulados e formulário de inscrição demonstrativo.

Os dados reais passam pelo cliente gerado em `src/generated/api`, pelo serviço de leituras e pelo adaptador de apresentação em `src/services`. Os mocks ficam em `src/mocks`, acessados pelo serviço demonstrativo. Falhas da API geram estado de erro, sem troca automática por mocks. Não há envio ou persistência de e-mails.

O percentual é ilustrativo e os alertas não representam avaliação de segurança. Não são inferidos estado online, volume, calibração ou regras operacionais a partir de campos ausentes no Swagger.

## Atualização automática

Em modo API, o navegador mantém uma conexão Socket.IO com o backend. Após uma leitura ser salva, o aviso atualiza os dados pelo Orval sem F5. A reconexão também reconsulta as leituras. Configure `WEBSOCKET_PUBLIC_URL` com a origem pública do backend, sem segredos. No backend, `WS_ALLOWED_ORIGINS` permite as origens do frontend.

O indicador representa a conexão do navegador com o backend; ele não confirma o estado do hardware. Consulte a [documentação do WebSocket](../../docs/websocket.md) para configuração e testes.

## Swagger e Orval

```bash
npm run api:refresh   # baixa o JSON real, valida e gera
npm run api:generate  # valida a cópia local e gera, inclusive offline
```

A configuração está em `orval.config.ts`; a especificação fica em `openapi/backend.json`; os clientes e tipos ficam em `src/generated/api`. Não edite os arquivos gerados. Ao mudar a documentação do backend, execute `api:refresh` e revise a diferença do contrato e dos clientes.

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
npm run test:data
npm run test:api      # requer backend acessível; somente GET
npm run test:pages    # requer build; inicia processos temporários de produção
```

`test:pages` verifica as três rotas em demonstração e os estados de lista vazia/HTTP 500 em Visão Geral e Histórico. Não substitui a revisão interativa no navegador.

Consulte o [relatório da refatoração](docs/refatoracao-orval.md) para estruturas anterior/final, diagnóstico, validações e pendências.
