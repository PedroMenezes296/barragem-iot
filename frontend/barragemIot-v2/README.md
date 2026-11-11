# BarragemIot

Dashboard demonstrativo responsivo para monitoramento de um reservatório experimental. Construído com Next.js App Router, React, TypeScript e Material UI.

## Executar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Para produção, use `npm run build` e `npm start`.

## Páginas

- `/` — visão geral, níveis demonstrativos dos sensores e previsão simulada de chuva.
- `/historico` — leituras mockadas com filtro de período e paginação.
- `/alertas` — eventos simulados e formulário de inscrição demonstrativo.

Os dados ficam em `src/mocks` e são entregues às páginas pelo serviço em `src/services/dashboard.service.ts`. Não há chamadas ao backend nem envio ou persistência de e-mails.

O percentual exibido é apenas ilustrativo; os alertas não representam avaliação de segurança da barragem. A integração futura requer API NestJS documentada com Swagger/OpenAPI, cliente gerado com Orval e regras operacionais calibradas no backend.
