# PI5 — Contrato de comunicação de leituras (V1)

> **Tarefa:** T00.3 — Definir e versionar contrato de leitura  
> **Estado:** Definições de software acordadas; calibração física pendente  
> **Atualizado:** 22/10/2026  
> **Arquitetura:** Arduino Mega 2560 + Ethernet Shield W5100 → API NestJS → MongoDB  
> **Escopo:** formato e protocolo das leituras do dispositivo. Não inclui a previsão Open-Meteo, a rede neural ou o frontend.

## 1. Objetivo

Estabelecer um formato único para o JSON produzido pelo firmware Arduino (C++) e recebido pelo backend NestJS. A mesma especificação será usada para implementar `CreateLeituraDto`, `LeiturasController`, `LeiturasService` e o modelo de persistência no Prisma/MongoDB, sem necessidade de hardware montado para os primeiros testes.

O Arduino **não grava diretamente no banco**: envia `POST /leituras` ao NestJS, que validará e, quando a persistência estiver implementada, armazenará a leitura no MongoDB.

## 2. Protocolo e periodicidade

| Item | Definição |
|---|---|
| Método HTTP | `POST` |
| Rota | `/leituras` |
| Cabeçalho | `Content-Type: application/json` |
| Formato | Objeto JSON V1 |
| Rede inicial | Rede local, Arduino e computador/servidor acessíveis entre si |
| Porta demonstrativa | `3000` (configurável) |
| Intervalo na maquete | **5 segundos** entre tentativas periódicas de envio |
| Intervalo em uso real | **1 hora** entre leituras/envios previstos, sujeito a requisitos operacionais e testes |
| Controle de intervalo | `millis()` e constante configurável no firmware, evitando `delay()` longo |
| Segurança | HTTP somente na rede de testes; autenticação e transporte seguro a definir para ambiente real |

O endereço `http://192.168.1.100:3000/leituras` é apenas um exemplo; o IP será ajustado na implantação. A frequência operacional de uma hora é uma proposta do projeto, **não garantia de adequação a monitoramento de risco**: eventos rápidos podem exigir coleta mais frequente e alertas locais independentes da rede.

## 3. Payload JSON V1

### 3.1 Exemplo válido (valores simulados)

```json
{
  "versao": 1,
  "idDispositivo": "arduino-mega-01",
  "idLeitura": "arduino-mega-01-20261022T160000-001",
  "timestampRtc": "2026-10-22T16:00:00-03:00",
  "distanciaCm": 35.7,
  "nivelUltrassonicoCm": 14.3,
  "nivelResistivoCm": 3.2,
  "umidadePct": 65.0
}
```

**Atenção:** os números são fictícios e não expressam calibração concluída. A leitura do sensor resistivo só poderá ser expressa honestamente em centímetros **após calibração no recipiente e na faixa útil do sensor**. Até essa calibração, o firmware deve **omitir** `nivelResistivoCm`, em vez de inventar uma medida em centímetros. O mesmo vale para `nivelUltrassonicoCm` até conhecer a altura de referência.

### 3.2 Campos e validações

| Campo | Tipo JSON | Obrigatório | Origem | Significado e regra |
|---|---|---|---|---|
| `versao` | inteiro | **Sim** | Firmware | Nesta versão, exatamente `1`. |
| `idDispositivo` | texto | **Sim** | Configuração | ID estável do equipamento. Ex.: `arduino-mega-01`. |
| `idLeitura` | texto | **Sim** | Firmware | Identificador único da medição; preservado em tentativas de reenvio. |
| `timestampRtc` | texto ISO 8601 com fuso | **Sim** | RTC + configuração do fuso | Data/hora **da medição**, não do recebimento. |
| `distanciaCm` | número | Não* | HC-SR04 | Distância entre o sensor e a superfície da água, em cm; finito e não negativo. |
| `nivelUltrassonicoCm` | número | Não* | Cálculo a partir do HC-SR04 | Altura da coluna de água em cm, definida em relação à referência física da maquete; finita e não negativa. |
| `nivelResistivoCm` | número | Não* | Sensor resistivo calibrado | Altura estimada da água, em cm, **somente dentro da faixa calibrada** desse sensor; finita e não negativa. |
| `umidadePct` | número | Não* | DHT | Umidade relativa do ar, de 0 a 100%. |

\* **Regra de tolerância a falhas:** pelo menos um campo de medição deve estar presente. Se um sensor falhar, omitir apenas os campos dependentes desse sensor e continuar enviando os demais dados disponíveis. Não substituir falha por `0` nem usar `NaN`, `Infinity` ou números como strings.

**Escopo aprovado para V1:** o usuário solicitou apenas a **umidade** do DHT, portanto `temperaturaC` não entra no payload nesta versão; poderá ser acrescentado depois como campo opcional mediante atualização documentada do contrato.

### 3.3 Diferença entre distância e nível

- **Distância ultrassônica:** medida diretamente pelo HC-SR04 desde sua posição até a água (`distanciaCm`).
- **Nível ultrassônico:** valor calculado a partir de uma altura de referência física, por exemplo `nivelUltrassonicoCm = alturaReferenciaCm - distanciaCm`, quando o sensor estiver orientado verticalmente e o zero de nível estiver definido.
- **Nível resistivo:** não é medido diretamente em centímetros por esse modelo genérico de trilhas; requer teste e calibração por imersão. A faixa útil costuma ser pequena. A comparação numérica entre os dois níveis só faz sentido se ambos representarem **a mesma referência e unidade**, dentro da faixa que os dois sensores conseguem medir.

**Pendente para a montagem:** determinar `alturaReferenciaCm`, a origem do nível zero, o posicionamento do sensor resistivo e a curva de calibração da leitura analógica para centímetros. A ausência dessa calibração não impede testes com JSON simulado.

## 4. Identificação, RTC e prevenção de duplicações

- Chave lógica de unicidade: `(idDispositivo, idLeitura)`.
- Uma nova medição gera um novo `idLeitura`.
- Reenviar a **mesma medição** deve preservar `idLeitura`, `timestampRtc` e os valores originais.
- O backend deverá usar um índice único composto para evitar duplicação no MongoDB.
- O RTC fornece horário da medição. Como o relógio pode não armazenar fuso, o firmware deve aplicar uma convenção de horário confiável antes de produzir o ISO 8601 com `-03:00`.
- A estratégia exata para manter IDs únicos após reinicialização ou falta de energia será testada na etapa de firmware. Não se deve reiniciar a numeração de modo a colidir com identificadores antigos.

## 5. Exemplo de requisição HTTP

```http
POST /leituras HTTP/1.1
Host: 192.168.1.100:3000
Content-Type: application/json
Connection: close

{"versao":1,"idDispositivo":"arduino-mega-01","idLeitura":"arduino-mega-01-20261022T160000-001","timestampRtc":"2026-10-22T16:00:00-03:00","distanciaCm":35.7,"nivelUltrassonicoCm":14.3,"nivelResistivoCm":3.2,"umidadePct":65.0}
```

O Arduino deverá incluir `Content-Length` com o tamanho real do corpo JSON. O computador que executa NestJS precisa estar acessível pela rede Ethernet.

## 6. Respostas esperadas da API

| HTTP | Significado | Comportamento do Arduino |
|---|---|---|
| `202 Accepted` | Etapa inicial: requisição validada e recebida, **sem persistência ainda** | Registrar confirmação provisória; não presumir gravação definitiva |
| `201 Created` | Leitura nova persistida | Considerar leitura confirmada |
| `200 OK` | Mesma leitura já gravada; não duplicou | Considerar leitura confirmada |
| `400 Bad Request` | JSON/campos inválidos | Registrar erro; corrigir o firmware/dados antes de repetir |
| `401 Unauthorized` | Falha de autenticação, quando implementada | Não prosseguir sem credencial correta |
| `503 Service Unavailable` | Falha temporária do serviço/banco | Guardar a medição para tentativa posterior, se houver buffer/fila |

### 6.1 Confirmação de leitura gravada (futura persistência)

```json
{
  "mensagem": "Leitura registrada",
  "idDispositivo": "arduino-mega-01",
  "idLeitura": "arduino-mega-01-20261022T160000-001",
  "duplicada": false
}
```

### 6.2 Leitura repetida sem duplicação

```json
{
  "mensagem": "Leitura ja registrada",
  "idDispositivo": "arduino-mega-01",
  "idLeitura": "arduino-mega-01-20261022T160000-001",
  "duplicada": true
}
```

## 7. Exemplos inválidos

**Sem identificação do dispositivo:**

```json
{
  "versao": 1,
  "idLeitura": "leitura-001",
  "timestampRtc": "2026-10-22T16:00:00-03:00",
  "distanciaCm": 35.7
}
```

**Nível representado como texto, não número:**

```json
{
  "versao": 1,
  "idDispositivo": "arduino-mega-01",
  "idLeitura": "leitura-002",
  "timestampRtc": "2026-10-22T16:00:00-03:00",
  "nivelUltrassonicoCm": "14.3"
}
```

**Umidade fora do intervalo físico:**

```json
{
  "versao": 1,
  "idDispositivo": "arduino-mega-01",
  "idLeitura": "leitura-003",
  "timestampRtc": "2026-10-22T16:00:00-03:00",
  "umidadePct": 125
}
```

**Sem nenhuma medição:**

```json
{
  "versao": 1,
  "idDispositivo": "arduino-mega-01",
  "idLeitura": "leitura-004",
  "timestampRtc": "2026-10-22T16:00:00-03:00"
}
```

Esses exemplos deverão resultar em `400 Bad Request` no DTO. Também deverão ser rejeitados campos desconhecidos, salvo atualização expressa do contrato.

## 8. Aplicação no NestJS e no MongoDB

```text
Arduino Mega (C++)
  └── envia JSON V1 por HTTP POST
        └── LeiturasController (rota POST /leituras)
              └── CreateLeituraDto (validar campos/unidades)
                    └── LeiturasService (regras e tratamento de repetição)
                          └── PrismaService → MongoDB (futuro)
```

Os campos públicos do DTO devem usar os mesmos nomes do payload. Campos internos de persistência poderão ser acrescentados pelo backend, como `_id`, `timestampRecebimento` e indicadores de processamento, sem exigência de envio pelo Arduino.

Para os primeiros testes, o backend poderá apenas imprimir/validar o JSON e responder `202 Accepted` em vez de alegar que o documento foi salvo.

## 9. Critérios de conclusão da T00.3

- [x] Definir rota, método HTTP e formato JSON.
- [x] Definir nomes, tipos, unidades e obrigatoriedade dos campos.
- [x] Documentar distância e nível do HC-SR04 como informações distintas.
- [x] Definir nível resistivo como medição que exige calibração.
- [x] Definir frequência de 5 segundos na maquete e proposta de 1 hora na operação real.
- [x] Definir envio parcial quando um sensor falhar.
- [x] Definir identificadores, horário, duplicações e respostas HTTP.
- [x] Incluir exemplos válidos e inválidos.
- [ ] Adicionar o arquivo `docs/contrato-leituras.md` ao repositório e registrar commit.

**Validação física posterior:** medida de referência para o nível ultrassônico, calibração e faixa do sensor resistivo, confiabilidade do RTC e teste de IDs/retransmissões. Essas validações são tarefas de implementação e **não bloqueiam a documentação do contrato inicial**.

## 10. Versionamento

- **V1**: contrato de desenvolvimento com valores simulados, aprovado quanto aos campos e periodicidade pretendida.
- Campos opcionais novos, como temperatura, exigem atualização documentada.
- Renomear campos, trocar unidades ou mudar interpretação de valores exige revisão explícita de compatibilidade e possível V2.
