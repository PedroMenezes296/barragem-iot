# Previsão de chuva dos próximos sete dias

O backend consulta a Forecast API da Open-Meteo e expõe `GET /meteorologia/previsao`, documentado no Swagger. O gráfico usa precipitação total diária prevista (`precipitation_sum`) em milímetros. A janela inclui hoje e os próximos seis dias, calculados no fuso configurado. Não depende do RTC do Arduino.

## Localização

Copie as opções de `backend/.env.weather.example` para o arquivo `backend/.env`, preenchendo `WEATHER_LATITUDE`, `WEATHER_LONGITUDE` e `WEATHER_LOCATION_NAME` com as coordenadas públicas aproximadas e o nome da cidade do reservatório. `WEATHER_TIMEZONE` usa `America/Sao_Paulo` por padrão. Reinicie o backend após mudar o arquivo de ambiente. Não há cidade presumida nem chave de API necessária para o uso acadêmico da API pública.

Sem coordenadas válidas, o endpoint responde HTTP 503 e o painel indica que a localização ainda não foi configurada. Outros recursos do sistema continuam funcionando.

## Atualização e falhas

A primeira consulta busca a previsão no provedor. Consultas seguintes reutilizam um cache em memória por até 15 minutos. Na mudança do dia local ou da configuração, o cache anterior deixa de valer. Requisições simultâneas para a mesma janela compartilham a consulta em andamento. Após uma falha, novas tentativas ao provedor aguardam um minuto. Nenhuma previsão é gravada no MongoDB.

Com a Visão Geral aberta e visível, o frontend reconsulta o backend a cada minuto e ao retornar à aba. O backend renova os valores conforme o prazo acima. O painel mostra a localidade, a fonte e o horário da consulta ao provedor, que não é o horário de geração do modelo meteorológico.

Falhas de rede, timeout ou resposta inválida mostram indisponibilidade, sem substituir a previsão por valores fictícios ou por zeros. Valores diários ausentes continuam nulos. Datas são dias locais, sem deslocamento indevido por conversão de fuso no gráfico. A previsão carrega em uma área própria com `Suspense`, sem aguardar a consulta meteorológica para mostrar os sensores.

O modo explícito `DATA_SOURCE=mock` mantém a demonstração identificada, com datas móveis. Os alertas meteorológicos da lista de eventos continuam demonstrativos; esta integração não cria regras de inundação por chuva nem modifica os alarmes do hardware.

## Verificação

- Backend: `npm test` e `npm run build`, incluindo janela de sete dias, cache, concorrência, virada do dia no fuso, configurações inválidas, nulos, erros e recuperação.
- Frontend: `npm run test:data`, `npm run typecheck`, `npm run lint`, `npm run build` e `npm run test:pages`, com API substituída por um servidor de teste local.

Fonte e atribuição: [Open-Meteo](https://open-meteo.com/) e [documentação da Forecast API](https://open-meteo.com/en/docs).
