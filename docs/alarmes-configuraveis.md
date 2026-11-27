# Limites configuráveis dos alarmes da maquete

Esta etapa continua em `feat/websocket-monitoramento`. O Arduino calcula nível e percentual e decide o alarme físico localmente, mesmo sem conexão. O NestJS refaz os cálculos independentemente para avaliar as leituras recebidas. O dashboard configura a referência e os limites compartilhados. Não foi enviado firmware à placa e nenhum limite de teste foi salvo na configuração real.

## Uso na página Alertas

Abra `/alertas`, informe o dispositivo, a **distância do sensor ao fundo com o reservatório vazio**, a **altura da água em 100%** e os três limites em porcentagem da altura.

| Faixa padrão | Estado |
| --- | --- |
| 0% até 20%, inclusive | Seca |
| Acima de 20% e abaixo de 80% | Normal |
| 80% até abaixo de 95% | Atenção |
| 95% ou mais | Inundação |

Os limites são editáveis, exigindo `0 <= secaPct < atencaoPct < inundacaoPct <= 100`. As referências aceitam duas casas decimais: `2 < distanciaFundoCm <= 400` e `0 < alturaCheioCm <= distanciaFundoCm - 2`. A sugestão de distância de 5,75 cm só é aplicada ao salvar; a altura de 100% deve ser medida e informada pelo usuário.

Arduino e backend calculam `nível = distanciaFundoCm - distanciaCm` e `percentual = nível / alturaCheioCm × 100`. O percentual é arredondado para duas casas antes da classificação, com a mesma aritmética inteira em ambos. Inundação não define mais 100%. Valores acima de 100% são permitidos nas medições e continuam em inundação; não representam volume. A classificação é por intervalos a cada leitura válida: não exige igualdade exata, cruzamento gradual nem tempo de permanência.

Instalações novas iniciam com os padrões 20/80/95%, desativadas e sem calibração presumida. Configurações V1 existentes continuam em centímetros até a conversão explícita. O formulário mostra os limites antigos e permite convertê-los após informar a altura de 100%: `limitePct = limiteCm / alturaCheioCm × 100`. Conversões sobrepostas ou fora de 0 a 100% exigem revisão manual. O interruptor de ativação é preservado. Ao salvar a primeira conversão, o backend conserva o JSON original em `alertas.json.v1.json` (ou no caminho de `ALARM_CONFIG_FILE` acrescido de `.v1.json`).

Use **Salvar limites** para persistir, mantendo ou ativando o interruptor de alarmes. Desativar o interruptor e salvar desativa os alarmes por nível; os valores permanecem guardados. Os limites pertencem ao dispositivo informado, evitando avaliar um sensor de outro dispositivo.

No navegador, o aviso visual aparece em todas as páginas enquanto um limite está ativo. O som é opcional: clique em **Ativar som neste navegador**. Quando ativo, há um sinal a cada cinco segundos; **Silenciar som** interrompe o áudio, preservando o aviso visual e o alarme físico. Após recarregar o navegador, é necessário habilitar o som novamente por causa das regras de reprodução automática. Não há envio de e-mail real.

Os eventos demonstrativos existentes ficam identificados em uma seção separada. Não são confundidos com o estado real dos alarmes. Limites da maquete não constituem avaliação de segurança de uma barragem real.

## Backend e persistência

Novos contratos, documentados no Swagger e gerados pelo Orval:

| Operação | Finalidade |
| --- | --- |
| GET /alertas/configuracao | Valores salvos e limite configurável |
| PUT /alertas/configuracao | Dispositivo, ativação, `distanciaFundoCm`, `alturaCheioCm`, `secaPct`, `atencaoPct` e `inundacaoPct` |
| GET /alertas/estado?idDispositivo=arduino-mega-01 | Estado calculado para o solicitante; ID opcional para o dashboard |

Referência e limites são persistidos em `backend/.data/alertas.json`, ignorado pelo Git. `ALARM_CONFIG_FILE` pode mudar o caminho; preserve esse arquivo/volume ao implantar. As escritas são serializadas e a substituição é atômica. O arquivo é validado ao iniciar; uma configuração corrompida impede a inicialização. A implementação é para uma instância do backend. Não foi alterado o schema MongoDB.

O JSON também guarda `referenciaDesde`. Alterar qualquer referência de calibração ou dispositivo invalida leituras anteriores para o comando do alarme, inclusive após reiniciar o backend. Os níveis históricos não são recalculados. Persistência de leituras e alterações da configuração usam a mesma fila para evitar que uma leitura em andamento receba a referência errada. `recebidoEm` é gerado no NestJS, com ordenação de milissegundos para distinguir operações simultâneas.

`POST /leituras` calcula `nivelUltrassonicoCm = distanciaFundoCm − distanciaCm` (duas casas decimais) antes de salvar e emitir o evento. Só calcula para o dispositivo configurado, com distância finita entre 2 e 400 cm e até a referência. Sem referência ou distância válida, salva nível `null`. O cálculo continua funcionando com alarmes desativados. O campo legado `nivelUltrassonicoCm` continua opcional no DTO V1, marcado como obsoleto no Swagger, mas seu valor é ignorado. Umidade e nível resistivo mantêm o contrato anterior.

Após salvar, o evento Socket.IO `alertas:configuracao` atualiza os navegadores. Leituras continuam usando `leitura:criada`. O frontend utiliza os clientes e DTOs gerados em `src/generated/api`; não há interfaces manuais duplicando os novos contratos.

A avaliação usa o nível ultrassônico e a leitura mais recentemente **recebida** do dispositivo configurado. Usa `recebidoEm` para expiração, pois o firmware de teste tem RTC fixo. Valores ausentes, fora da faixa ou recebidos há mais de 30 segundos não geram novos alarmes no dashboard. Zero é uma medição válida. Não há substituição de nulos por zero ou fallback para dados simulados.

O estado contém `idDispositivo` e `percentualNivelPct` calculado pelo backend. Sem calibração percentual ou leitura válida/recente, o percentual é `null`. Alarmes desativados não impedem consultar nível e percentual; apenas desativam o alerta. Se o solicitante informar outro dispositivo, recebe `desativado`, `alarmeAtivo: false` e valores de leitura nulos para seu próprio ID. O card principal usa o mesmo percentual real e expiração do monitor de alarmes. Sem dados, mostra indisponibilidade; acima de 100%, mantém o número real e limita apenas o arco visual. No modo demonstração, mantém o indicador fictício identificado. A previsão e a lista de eventos continuam demonstrativas.

## Arduino

O fonte atualizado está em `hardware/arduino_pi5_ethernet/arduino_pi5_ethernet.ino`, com regras e armazenamento em `local-alarm.h`. Mantém aquisição, conversão do eco em centímetros e filtragem. Calcula `nível = referência − distância`, percentual e classificação localmente. Não envia nível ultrassônico, percentual nem decisão de alarme: o backend continua recebendo a distância e refazendo o cálculo. O nível resistivo e a umidade permanecem no contrato anterior; seu envio continua desabilitado no modo de teste existente, assim como o timestamp fixo de teste foi preservado.

A placa consulta GET `/alertas/configuracao` ao iniciar a comunicação e a cada dez segundos, independentemente de haver POST confirmado ou pendente. Confere o dispositivo, a faixa e a ordem dos limites antes de aplicar. Alterar a referência faz o filtro aguardar novas amostras. O endpoint `/alertas/estado` não comanda o buzzer/relé.

A última configuração válida é salva somente quando seus valores mudam. A EEPROM usa duas cópias com assinatura, versão, identificação do dispositivo, geração e CRC32 a partir do byte 512, preservando os registros legados a partir do byte 16 e os bytes 0–3 do contador de boot. A assinatura de cada cópia é escrita por último; se uma gravação for interrompida, o reinício recupera a cópia íntegra anterior. Nenhuma configuração é gravada na EEPROM real antes de executar o firmware na placa.

**É necessário compilar e gravar essa versão no Mega 2560 para os campos do frontend controlarem os limites do Arduino.** O fonte foi compilado com Arduino CLI; não foi executado upload. A versão que já estava na placa não recebe essas configurações.

Comportamento em falhas:

- Ao reiniciar sem rede, o Arduino recupera a configuração válida da EEPROM e passa a avaliar as novas medições. Sem configuração válida, sinaliza falha e não presume limites.
- Falhas no POST ou na sincronização preservam a configuração, mas **não congelam a avaliação do sensor**: novas medições continuam acionando e desligando o alarme local.
- Distâncias sem eco, fora da faixa, acima da referência, ou sem atualização válida há mais de um segundo são indisponíveis. Um alarme de nível já ativo permanece até nova medição válida ou desativação explícita.
- Sem alarme de nível já ativo, a falta de configuração/medição gera dois sinais de 100 ms a 2 kHz, separados por 150 ms, a cada cinco segundos. O alarme de nível é contínuo a 1 kHz e tem prioridade. Falha isolada sinaliza apenas no buzzer; não aciona o relé. Desativação explícita silencia o buzzer e desativa o relé; o diagnóstico de falha permanece no Serial.
- Alterações no dashboard chegam na próxima sincronização bem-sucedida. Não se confirma acionamento físico pelo painel: não existe confirmação dos atuadores no contrato atual. Durante desconexão, a placa pode usar limites anteriores aos do backend.
- Aquisição e alarme são atendidos também durante a espera dos bytes HTTP, com prazo total de três segundos por resposta e limite de bytes por passagem. Conexões TCP usam timeout de 250 ms e retransmissão limitada. Ainda existem trechos síncronos na biblioteca Ethernet, escrita EEPROM, inicialização e DHT; não é um sistema de tempo real com prazo garantido. O ensaio físico deve verificar a latência desses trechos.
- Não há histerese nesta etapa; leituras oscilando em torno dos limites podem alternar o estado.

## Implantação e compatibilidade

Primeiro carregar o firmware atualizado, que aceita configurações V1 em centímetros e V2 em porcentagem; depois atualizar backend/frontend. Por último informar a altura de 100%, converter/revisar os limites e salvar. Configurações convertidas preservam os limites anteriores; 20/80/95% são os padrões das configurações novas.

O armazenamento novo usa dois registros versionados a partir do byte 512 da EEPROM. A leitura dos registros V1 a partir do byte 16 é mantida, e a área antiga e o contador de boot não são sobrescritos. A assinatura é escrita por último para recuperar uma cópia válida após queda de energia. Alterar calibração aguarda novas amostras locais. Backend e firmware não confirmam instalação ou acionamento físico pelo painel; durante desconexão, a placa continua com a última configuração sincronizada.

## Verificações

Backend: testes unitários, lint, TypeScript, build, testes de WebSocket e `npm run test:alarms`. Este último usa banco substituído por memória e arquivo temporário para verificar HTTP, validação, notificações, nulos, limites exatos, expiração, desativação e persistência após reinício. Não muda a configuração nem as leituras reais.

Frontend: lint, TypeScript, build, `npm run test:alarms`, testes das páginas e clientes HTTP. O teste do formulário cobre vírgula decimal, ordenação e faixa dos valores. A especificação real foi atualizada com `api:refresh` e os clientes foram efetivamente gerados.

Firmware: validar a compilação para `arduino:avr:mega` com as bibliotecas da montagem antes da instalação. Gravação e teste físico do relé/buzzer serão realizados separadamente. O IP do backend e a rede fixa do firmware precisam corresponder à montagem.

Execute `node hardware/tests/run-tests.mjs` na raiz (requer `g++`, ou seu caminho em `CXX`). O teste compila o `.ino` real com substitutos de hardware e testa fórmulas/limites iguais aos do backend, percentuais acima de 100%, desconexão, API que aceita TCP mas não responde, buzzer, EEPROM, reinício, corrupção e interrupções de gravação. Os artefatos ficam em `.validation/`. A simulação não substitui o ensaio do sensor, do W5100 e dos atuadores reais.

## Limpeza pontual dos dados de treino

Em 18/11/2026, o destino foi confirmado pela configuração: MongoDB local `127.0.0.1`, banco `pi5`, coleção `leituras`. Foram excluídos 211 documentos; contagem final zero. A coleção e seus índices foram preservados. Nenhuma configuração real de alarme foi criada ou modificada.

O utilitário `backend/scripts/clear-training-readings.mjs` é executado manualmente a partir de `backend`: sem argumentos, apenas inspeciona; `--clear --database=pi5` exige que o nome coincida com `DATABASE_URL` antes de excluir documentos exclusivamente de `leituras`. Não existe limpeza automática ao iniciar o servidor.
