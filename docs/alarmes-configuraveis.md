# Limites configuráveis dos alarmes da maquete

O WebSocket foi registrado no commit `700eb03`. Esta etapa continua em `feat/websocket-monitoramento` e acrescenta a configuração dos alarmes ao dashboard, backend e fonte do firmware. Não foi enviado firmware à placa e nenhum limite de teste foi salvo na configuração real.

## Uso na página Alertas

Abra `/alertas`, informe o dispositivo e configure três valores em **cm de altura da água**:

- **Seca:** dispara quando `nível <= mínimo`.
- **Atenção:** dispara quando `atenção <= nível < inundação`.
- **Inundação:** dispara quando `nível >= máximo`.

É obrigatório `0 <= seca < atenção < inundação <= 3,75`. O nível é `5,75 − distância medida`. A referência sensor–fundo é 5,75 cm e o firmware rejeita distâncias menores que 2 cm, limitando o nível ultrassônico mensurável a 3,75 cm nesta montagem. Não há valores presumidos: a instalação inicia desativada e com campos vazios.

Use **Salvar limites** para persistir, mantendo ou ativando o interruptor de alarmes. Desativar o interruptor e salvar desativa os alarmes por nível; os valores permanecem guardados. Os limites pertencem ao dispositivo informado, evitando avaliar um sensor de outro dispositivo.

No navegador, o aviso visual aparece em todas as páginas enquanto um limite está ativo. O som é opcional: clique em **Ativar som neste navegador**. Quando ativo, há um sinal a cada cinco segundos; **Silenciar som** interrompe o áudio, preservando o aviso visual e o alarme físico. Após recarregar o navegador, é necessário habilitar o som novamente por causa das regras de reprodução automática. Não há envio de e-mail real.

Os eventos demonstrativos existentes ficam identificados em uma seção separada. Não são confundidos com o estado real dos alarmes. Limites da maquete não constituem avaliação de segurança de uma barragem real.

## Backend e persistência

Novos contratos, documentados no Swagger e gerados pelo Orval:

| Operação | Finalidade |
| --- | --- |
| GET /alertas/configuracao | Valores salvos e limite configurável |
| PUT /alertas/configuracao | Dispositivo, ativação e os três níveis |
| GET /alertas/estado | Estado calculado da última leitura recebida |

Os limites são persistidos em `backend/.data/alertas.json`, ignorado pelo Git. `ALARM_CONFIG_FILE` pode mudar o caminho; preserve esse arquivo/volume ao implantar. As escritas são serializadas e a substituição é atômica. O arquivo é validado ao iniciar; uma configuração corrompida impede a inicialização, em vez de ativar limites presumidos. A implementação é para uma instância do backend. Não foi alterado o schema MongoDB nem o contrato V1 de envio das leituras.

Após salvar, o evento Socket.IO `alertas:configuracao` atualiza os navegadores. Leituras continuam usando `leitura:criada`. O frontend utiliza os clientes e DTOs gerados em `src/generated/api`; não há interfaces manuais duplicando os novos contratos.

A avaliação usa o nível ultrassônico e a leitura mais recentemente **recebida** do dispositivo configurado. Usa `recebidoEm` para expiração, pois o firmware de teste tem RTC fixo. Valores ausentes, fora da faixa ou recebidos há mais de 30 segundos não geram novos alarmes no dashboard. Zero é uma medição válida. Não há substituição de nulos por zero ou fallback para dados simulados.

## Arduino

O fonte atualizado está em `hardware/arduino_pi5_ethernet/arduino_pi5_ethernet.ino`. Ele mantém o POST de leituras e consulta GET `/alertas/configuracao` a cada dez segundos. Após receber uma configuração válida para seu ID, compara a medição local com os três níveis e aciona buzzer/relé em seca, atenção ou inundação. O Monitor Serial identifica a categoria.

**É necessário compilar e gravar essa versão no Mega 2560 para os campos do frontend controlarem os limites do Arduino.** O fonte foi compilado com Arduino CLI; não foi executado upload. A versão que já estava na placa não recebe essas configurações.

Comportamento em falhas:

- Ao reiniciar, o Arduino fica com alarmes desativados até receber uma configuração válida.
- Se o backend ficar indisponível após uma sincronização, mantém os últimos limites válidos na RAM e continua avaliando o sensor local.
- Sem uma nova medição válida, não modifica o estado anterior do buzzer/relé. Um alarme já acionado permanece até uma leitura válida normal ou uma desativação recebida do backend.
- Desativar no dashboard só alcança o Arduino quando ele consultar a API com sucesso, normalmente em até dez segundos. O painel não afirma que o relé foi acionado/desativado fisicamente: não existe confirmação de estado dos atuadores no contrato atual.
- Não há histerese nesta etapa; leituras oscilando em torno dos limites podem alternar o estado.

## Verificações

Backend: testes unitários, lint, TypeScript, build, testes de WebSocket e `npm run test:alarms`. Este último usa banco substituído por memória e arquivo temporário para verificar HTTP, validação, notificações, nulos, limites exatos, expiração, desativação e persistência após reinício. Não muda a configuração nem as leituras reais.

Frontend: lint, TypeScript, build, `npm run test:alarms`, testes das páginas e clientes HTTP. O teste do formulário cobre vírgula decimal, ordenação e faixa dos valores. A especificação real foi atualizada com `api:refresh` e os clientes foram efetivamente gerados.

Firmware: compilação para `arduino:avr:mega` com bibliotecas já instaladas. O teste físico do relé/buzzer e a interação completa com formulário/áudio ainda exigem conferência manual; o host de navegador automatizado está indisponível.
