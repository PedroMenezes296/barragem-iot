# Revisão do backend e integração Swagger

Data: 17/11/2026.

## Diagnóstico anterior às alterações

A revisão dos arquivos de aplicação, testes, configuração e contrato de hardware ocorreu antes da edição dos fontes. Não havia Swagger instalado, configuração OpenAPI ou decorators de documentação.

- NestJS instalado: 12.2.0; projeto ESM com TypeScript, Express, class-validator e class-transformer. MongoDB acessado por Prisma 6.19.3, sem schemas Mongoose.
- Módulos: `AppModule`, `LeiturasModule` e `PrismaModule`. `ConfigModule.forRoot({ isGlobal: true })` carrega as configurações. `PrismaModule` fornece e exporta `PrismaService` e é importado por App e Leituras.
- Controllers: `AppController` e `LeiturasController`.
- Services: `AppService`, `LeiturasService` e `PrismaService`. Prisma conecta em `onModuleInit` e desconecta em `onModuleDestroy`.
- Entrada: `CreateLeituraDto`, com quatro campos obrigatórios (`versao`, `idDispositivo`, `idLeitura`, `timestampRtc`) e quatro medições opcionais. A classe `Leitura` em `entities/leitura.entity.ts` está vazia e não é usada na persistência.
- Schema: `prisma/schema.prisma`, modelo `Leitura`, coleção `leituras`, ObjectId, campos do contrato, medições anuláveis e `recebidoEm` gerado pelo banco. Declara índice único composto em dispositivo/leitura e índice em recebimento; a existência física desses índices no banco não foi auditada.
- `main.ts`: ValidationPipe global com `whitelist`, `forbidNonWhitelisted` e `transform` habilitados; host por `HOST` (padrão `127.0.0.1`) e porta por `PORT` (padrão `3000`). Sem configuração de CORS, prefixo global ou autenticação. Essas configurações foram preservadas.
- Scripts disponíveis: build, deploy, format, start, start:dev, start:debug, start:prod, lint, test, test:watch, test:cov, test:debug e test:e2e. Não foi executado deploy.

| Operação original | Fluxo implementado | Resposta de sucesso no código |
| --- | --- | --- |
| GET / | AppController → AppService | 200, texto `Hello World!` |
| POST /leituras | ValidationPipe → CreateLeituraDto → LeiturasController → LeiturasService → Prisma `leitura.create` → MongoDB | 201, `{ mensagem, leitura }` |
| GET /leituras | LeiturasController → LeiturasService → Prisma `leitura.findMany`, por `recebidoEm` decrescente | 200, array de leituras |

O DTO exige versão inteira igual a 1, identificadores textuais não vazios e timestamp ISO 8601 com fuso. Medições numéricas não negativas e umidade entre 0 e 100 são validadas quando presentes. `IsOptional` também aceita null. Não existem parâmetros de rota, filtros, paginação, endpoints por ID ou respostas 404 específicas nessas operações.

### Problemas e diferenças preexistentes

- O contrato `docs/contrato-leituras-hardware.md` prevê pelo menos uma medição; essa validação conjunta não existe no DTO atual.
- O service insere diretamente: não implementa confirmação idempotente de duplicidade. Erros Prisma não são traduzidos para códigos específicos e ficam sujeitos ao tratamento padrão 500 do Nest. As respostas futuras 202/200 para reenvio, 401 e 503 descritas no contrato não estão implementadas.
- A resposta de persistência atual difere dos exemplos futuros do contrato: retorna mensagem e documento completo. A documentação Swagger segue o código executável.
- Os testes unitários de Leituras não fornecem `PrismaService` e falham na montagem do módulo. Não foram corrigidos nesta tarefa.
- O teste e2e existente cobre somente GET / e não testa o bootstrap de `main.ts`, o Swagger ou gravação de leituras.
- Calibração, integração física Arduino/sensores, autenticação, tratamento de indisponibilidade e teste de reenvios não foram validados nesta tarefa.

## Implementação e arquivos alterados

1. `backend/package.json` e `backend/package-lock.json`: adicionada somente a dependência direta `@nestjs/swagger` (`^12.1.2`, instalada 12.1.2). Compatibilidade conferida no npm: peers Nest common/core `^12.0.0` e TypeScript `^5.5.0 || ^6.0.0`. Dependências transitivas necessárias são controladas pelo lockfile.
2. `backend/src/main.ts`: DocumentBuilder com título BarragemIoT API, descrição e versão 1.0.0; SwaggerModule em `/api/docs`.
3. `backend/src/app.controller.ts`: tag, finalidade, tipo de conteúdo e resposta textual 200.
4. `backend/src/leituras/leituras.controller.ts`: tags, operações, corpo e respostas 201/400/500 no POST e 200/500 no GET. Sem declarar filtros ou códigos de funcionalidades futuras.
5. `backend/src/leituras/dto/create-leitura.dto.ts`: ApiProperty/ApiPropertyOptional, tipos, exemplos, unidades, obrigatoriedade, limites e nulabilidade aceita pelos validadores existentes. Nenhum validador, tipo ou nome de campo alterado.
6. `backend/src/leituras/dto/leitura-response.dto.ts`: modelos exclusivos de documentação `LeituraResponseDto` e `CreateLeituraResponseDto`; incluem `id`, campos anuláveis, `recebidoEm` e envelope de criação. Não são usados para transformar respostas ou persistir dados.
7. `frontend/barragemIot-v2/.gitignore`: dependências, `.next`, builds, caches, cobertura, logs, ambientes locais, certificados e arquivos temporários. Modelos `.env.example` são permitidos e lockfiles não são ignorados. No checkout, essa pasta contém apenas artefatos locais; não foi criada uma v3.
8. `docs/revisao-backend-swagger.md`: este relatório.

Decorators usados: ApiTags, ApiOperation, ApiProduces, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiProperty e ApiPropertyOptional. ApiParam/ApiQuery/ApiNotFoundResponse não se aplicam às rotas existentes.

Services, módulos, schema/coleções, firmware e código funcional do frontend não foram editados. Exemplos existem somente como metadados de documentação.

## Validação

| Comando/verificação | Antes | Depois |
| --- | --- | --- |
| `npm run build` | Aprovado | Aprovado |
| `npm test` | 1 aprovado, 2 falhas por ausência de PrismaService nos módulos de teste | Mesmo resultado e motivo |
| `npm run lint` | Aprovado | Aprovado |
| `npm run test:e2e` | 1 aprovado | 1 aprovado |

Os quatro comandos foram executados em `backend`. Os testes não foram modificados. Prettier foi executado apenas nos cinco arquivos TypeScript editados/criados para documentação.

### Verificações adicionais após integração

- Aplicação compilada executada com `node dist/main.js`, usando apenas no processo de validação `HOST=127.0.0.1` e `PORT=3107`. Inicialização e conexão MongoDB confirmadas nos logs.
- `GET /api/docs`: HTTP 200, HTML Swagger UI. CSS, bundle JS e script de inicialização: três respostas 200.
- `GET /api/docs-json`: HTTP 200, OpenAPI 3.0.0. Asserções confirmaram exatamente as três operações originais, os três schemas, quatro campos obrigatórios e oito propriedades de entrada, limites, nulabilidade, referência da resposta de criação e códigos de resposta.
- `GET /`: HTTP 200 e mensagem original preservada.
- `GET /leituras`: HTTP 200; nove registros existentes consultados e comparados às dez propriedades do schema de resposta. Conteúdo dos registros não incluído neste relatório.
- `POST /leituras` com versão inválida e propriedade desconhecida: HTTP 400, mensagens em array. Nenhuma leitura de exemplo foi persistida.
- Não foi executado POST válido, teste de duplicidade ou falha induzida do banco; 201 e 500 foram documentados pela implementação e tratamento padrão, sem alegar validação de gravação por execução.
- Asserções HTTP feitas com Node fetch e node:assert. Uma asserção inicial esperava `$ref` direto, mas o Swagger gera `allOf` para a propriedade descrita; a verificação foi ajustada ao documento retornado e a execução completa passou, sem mudança nos fontes para contornar esse resultado.
- `git check-ignore --no-index` confirmou que node_modules, .next, .env.local e tsconfig.tsbuildinfo da v2 são ignorados.
- Inspeção visual no navegador não concluída: a ferramenta retornou `The browser access host is unavailable`. Disponibilidade HTTP da interface e de seus recursos foi validada; renderização visual permanece pendente.

## Acesso

Em `backend`, executar `npm run start:dev` com a configuração MongoDB existente. Acessar `http://127.0.0.1:3000/api/docs` quando HOST/PORT estiverem nos padrões, ou substituir pelo host/porta configurados. OpenAPI JSON: `/api/docs-json`. A inicialização continua dependendo da conexão MongoDB existente.

Integração baseada na [documentação oficial OpenAPI do NestJS](https://docs.nestjs.com/openapi/introduction).

## Pendências fora do escopo

Corrigir o provisionamento de PrismaService nos testes, ampliar cobertura de validação/persistência, reconciliar o contrato planejado com o comportamento atual, decidir tratamento de duplicidades e falhas do banco, avaliar paginação e autenticação e validar hardware/calibração. Nenhuma dessas mudanças foi implementada.
