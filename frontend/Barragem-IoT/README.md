# HidroLab — frontend

Dashboard de demonstração do reservatório experimental, implementado com Next.js, React e TypeScript. As páginas de Visão Geral e Histórico usam leituras simuladas; Meteorologia e Alertas permanecem provisórias.

## Requisitos

- Node.js 20.9 ou superior
- npm

## Desenvolvimento

Na pasta `frontend/Barragem-IoT`:

```bash
npm install
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001). A API NestJS pode continuar usando a porta 3000.

## Scripts

- `npm run dev` — servidor Next.js de desenvolvimento na porta 3001.
- `npm run build` — build de produção.
- `npm start` — servidor de produção na porta 3001 (após o build).
- `npm run lint` — ESLint com as regras do Next.js.
- `npx tsc --noEmit` — verificação de tipos TypeScript.

## Estrutura

- `src/app/` — rotas App Router: `/`, `/historico`, `/meteorologia` e `/alertas`.
- `src/components/layout/` — layout compartilhado, navegação, cabeçalho e rodapé.
- `src/features/` — componentes específicos da Visão Geral e do Histórico.
- `src/data/` — leituras simuladas e séries de gráficos.
- `src/types/` — modelos visuais e contrato conceitual da API.

O frontend ainda não realiza chamadas HTTP. A integração futura deve validar o contrato real do backend antes de gerar ou consumir o cliente Orval.
