# Centralização de nível e alarmes — entrega e validação

Implementado em 18/11/2026 na branch `feat/websocket-monitoramento`.

> Histórico da entrega de 18/11. Em 23/11/2026, a decisão de alarme físico voltou a ser local: Arduino e backend calculam independentemente; referência/limites são sincronizados e persistidos na EEPROM para operar sem rede. O comportamento atual, testes e limitações estão em [alarmes configuráveis](alarmes-configuraveis.md). O restante deste relatório descreve a etapa anterior, não o firmware atual.

## Comportamento entregue

- NestJS calcula o nível pela referência persistida e pela distância recebida, antes da gravação e do evento WebSocket. O campo legado enviado pelo firmware é aceito e ignorado.
- Distância válida: 2 a 400 cm, até a referência do dispositivo configurado. Sem referência ou distância válida, nível `null`; reservatório vazio resulta em zero válido.
- Referência maior que 2 e até 400 cm; limites `0 <= seca < atenção < inundação <= referência - 2`. O frontend aceita vírgula decimal e apresenta o máximo calculado.
- Configuração permanece em JSON. Configurações anteriores sem referência iniciam desativadas. Alterações de referência/dispositivo aguardam novas leituras, inclusive após reinício, sem recalcular o histórico. Escritas concorrentes são serializadas.
- Arduino envia distância e consulta o estado após cada POST bem-sucedido; confere o dispositivo e executa `alarmeAtivo`. Aquisição e filtragem permanecem na placa.
- Visão Geral e Histórico continuam consumindo o nível retornado pela API. Visual e componentes do dashboard foram preservados, acrescentando o campo de referência em Alertas.

## Arquivos alterados

| Área | Arquivos |
| --- | --- |
| Cálculo e configuração | `backend/src/alertas/sensor-level.ts` (novo), `alertas.service.ts`, `alertas.dto.ts`, `alertas.controller.ts`, `alertas.module.ts` |
| Gravação e contrato | `backend/src/leituras/leituras.service.ts`, `leituras.module.ts`, `dto/create-leitura.dto.ts`, `dto/leitura-response.dto.ts` |
| Testes do backend | `backend/src/alertas/alertas.service.spec.ts`, `backend/src/leituras/leituras.service.spec.ts`, `backend/test/alarms.integration.mjs` |
| Formulário e serviço | `frontend/barragemIot-v2/src/components/alerts/AlarmLimitsForm.tsx`, `AlarmConfiguration.tsx`, `src/utils/alarm-form.ts`, `src/services/alarms.service.ts` |
| Swagger e Orval | `frontend/barragemIot-v2/openapi/backend.json`, cliente de alertas e modelos em `src/generated/api/`, incluindo o novo `alertasControllerGetStatusParams.ts`; gerados pelo Orval |
| Testes do frontend | `frontend/barragemIot-v2/scripts/check-alarms.mjs`, `scripts/check-pages.mjs` |
| Firmware | `hardware/arduino_pi5_ethernet/arduino_pi5_ethernet.ino` |
| Limpeza pontual | `backend/scripts/clear-training-readings.mjs` (novo) |
| Documentação | `docs/alarmes-configuraveis.md`, `docs/contrato-leituras-hardware.md`, este relatório |
| Artefatos locais | `.gitignore`: ignora `/.validation/`, usado para a compilação do firmware |

Prisma, schema MongoDB e entidade vazia de leitura não precisaram de alterações. Não houve novas dependências.

## Verificações executadas

| Diretório | Comando/verificação | Resultado |
| --- | --- | --- |
| `backend` | `npm test` | 40 testes passaram |
| `backend` | `npm run lint` | Passou |
| `backend` | `npx tsc --noEmit` | Passou |
| `backend` | `npm run build` | Passou |
| `backend` | `npm run test:alarms` | Passou: POST/GET, cálculo, campo legado, nulos/zero, faixa, limites exatos, dispositivo, histórico, troca de referência, reinício e expiração |
| `backend` | `npm run test:realtime` | Passou: broadcast, falhas sem evento, origem recusada, cliente frontend, rajadas e reconexão |
| `backend` | `npm run test:e2e` | 1 teste passou |
| `frontend/barragemIot-v2` | `npm run api:refresh` com Swagger real em `127.0.0.1:3002` | OpenAPI validado e Orval executado com sucesso |
| `frontend/barragemIot-v2` | `npm run lint`, `npm run typecheck`, `npm run build` | Passaram |
| `frontend/barragemIot-v2` | `npm run test:data`, `npm run test:alarms` | Passaram |
| `frontend/barragemIot-v2` | `npm run test:api` contra API real | HTTP 200, lista vazia compatível com Swagger |
| `frontend/barragemIot-v2` | `npm run test:pages` | Três páginas em produção HTTP 200; formulário, referência, máximo, lista vazia e erro HTTP 500 verificados |
| Firmware | Arduino CLI `compile --fqbn arduino:avr:mega` | Passou: 30.048 bytes de programa (11%) e 1.414 bytes de RAM (17%) |
| Repositório | `git diff --check` | Passou |

Os testes automatizados cobrem as referências 5,75 cm, 10 cm, 10,20 cm e o extremo de 400 cm, além de configuração legada e alteração da referência com persistência em andamento. As integrações que criam leituras usam Prisma substituído por memória e JSON temporário.

## Banco e operação

Destino confirmado pela configuração: MongoDB `127.0.0.1`, banco `pi5`, coleção `leituras`. Limpeza pontual: **211 documentos removidos; contagem final zero**, com coleção e índices preservados. A consulta posterior pelo cliente gerado confirmou zero registros. Não existe limpeza na inicialização.

Não foram salvos referência ou limites de teste na configuração real. Para usar, iniciar backend/frontend, preencher e salvar a referência e os limites em Alertas, e atualizar inicialmente o firmware da placa. A implementação de persistência em JSON considera uma instância do backend.

Gravação na placa, ensaio físico do buzzer/relé e validação da calibração ficam para a etapa separada prevista no plano. O comportamento em falha de comunicação continua mantendo o último comando recebido; não foi acrescentada política de desconexão.
