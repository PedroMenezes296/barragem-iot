# Atualização de leituras por WebSocket

Implementação na branch `feat/websocket-monitoramento`, sobre o frontend integrado com Orval. O hardware continua enviando `POST /leituras`. Os DTOs HTTP, Swagger e schema MongoDB permanecem iguais.

## Fluxo e contrato

```text
Hardware → POST /leituras → Prisma confirma persistência
                               ↓
                     evento leitura:criada
                               ↓
                   Socket.IO do navegador
                               ↓
             router.refresh() → Orval → GET /leituras
                               ↓
                 cards, gráfico e histórico
```

O evento de invalidação é `{ "id": "ID do documento salvo" }`. O cliente HTTP gerado continua sendo a fonte dos dados. Não são inseridas linhas diretamente a partir de eventos, evitando duplicações e contratos de medição paralelos.

## Backend

`src/leituras/leituras.gateway.ts` publica eventos na mesma porta do HTTP, path `/socket.io`, namespace `/`, transporte WebSocket. O serviço emite somente após confirmar a persistência. Falhas de persistência ou validação não publicam eventos. Falhas de emissão são registradas sem transformar uma leitura já salva em falha HTTP.

`WS_ALLOWED_ORIGINS` contém as origens autorizadas dos navegadores, separadas por vírgula. Padrão: `http://localhost:3001,http://127.0.0.1:3001`. A verificação ocorre no handshake por `allowRequest`: CORS de HTTP não controla conexões WebSocket. Clientes nativos sem `Origin` são permitidos; esta verificação não implementa autenticação.

Veja `backend/.env.websocket.example`. Acrescente a variável ao `.env` existente, preservando a configuração de banco.

## Frontend

- `src/lib/readings-socket.ts`: conexão, eventos, reconexão e limpeza.
- `src/hooks/useLiveReadings.ts`: liga eventos ao `router.refresh()` em uma transição React.
- `RuntimeShell` fornece a URL pública ao `AppShell`, que mantém a conexão compartilhada entre as páginas.
- Ao conectar ou reconectar, uma consulta recupera as leituras enviadas durante a queda. Os eventos não são um log durável.
- Avisos próximos são agrupados em uma janela de 250 ms. Desmontar cancela timers, remove listeners e encerra o socket.
- `DATA_SOURCE=mock` mantém a demonstração sem abrir conexão.
- O cabeçalho representa conexão com o backend, sem afirmar que o hardware está online. Percentual, chuva e alertas permanecem demonstrativos.

```dotenv
API_BASE_URL=http://127.0.0.1:3000
DATA_SOURCE=api
WEBSOCKET_PUBLIC_URL=http://localhost:3000
```

`API_BASE_URL` é privada do servidor Next.js. `WEBSOCKET_PUBLIC_URL` é intencionalmente enviada ao navegador em runtime: use apenas a origem HTTP(S) pública do backend, sem credenciais, query ou caminho. Não use um hostname privado de contêiner inacessível ao navegador.

Para acessar de outro computador, configure a URL pública com o endereço acessível do backend e acrescente a origem real do frontend em `WS_ALLOWED_ORIGINS`. Em HTTPS, o backend também deve usar HTTPS e o proxy deve encaminhar WebSocket. Reinicie os processos após alterar o ambiente.

```bash
# backend/
npm run start:dev
# frontend/barragemIot-v2/
npm run dev -- --port 3001
```

## Dependências e testes

Backend: `@nestjs/websockets` e `@nestjs/platform-socket.io` 12.5.1, `socket.io` 4.8.4 e `socket.io-client` 4.8.4 para testes. Frontend: `socket.io-client` 4.8.4. npm e os locks foram preservados.

```bash
# backend/
npm test
npm run lint
npx tsc --noEmit
npm run test:e2e
npm run test:realtime
# frontend/barragemIot-v2/
npm run lint
npm run typecheck
npm run build
npm run test:api
npm run test:pages
npm run api:generate
```

`test:realtime` compila o backend e sobe o módulo real de leituras em uma porta temporária, substituindo somente o Prisma por memória. Não grava leituras artificiais no MongoDB. Verifica broadcast para dois clientes reais, POST/GET, falhas sem emissão, recusa de origem e o código de assinatura usado pelo frontend. Também verifica sincronização inicial, agrupamento de rajadas, reconexão, recuperação de leitura perdida e cleanup sem conexões restantes.

Dois testes unitários antigos falhavam por falta de mocks do Prisma. Os testes de serviço/controlador foram corrigidos e ampliados para o fluxo de eventos. Foram confirmados também o handshake WebSocket com o backend real da porta 3000, as três páginas HTTP 200 e a igualdade do Swagger publicado com o snapshot Orval.

O navegador automatizado estava indisponível. Os testes de socket/HTTP não substituem a conferência visual. Para conferir manualmente, abra o dashboard e aguarde uma leitura do hardware, sem pressionar F5. Parar e restaurar o backend deve alterar o indicador e recuperar os dados ao reconectar.

## Limites

Esta implementação cobre uma instância do backend. Múltiplas instâncias exigirão um adaptador compartilhado. Escritas diretamente no MongoDB não emitem eventos. O banco é a fonte de verdade; não há outbox ou confirmação durável de entrega. Não foram adicionados polling, autenticação, regras de alerta ou cálculo de percentual.

Referências: [NestJS](https://docs.nestjs.com/websockets/gateways), [origens do Socket.IO](https://socket.io/docs/v4/handling-cors/), [reconexão](https://socket.io/docs/v4/tutorial/handling-disconnections), [Next.js](https://nextjs.org/docs/app/api-reference/functions/use-router).
