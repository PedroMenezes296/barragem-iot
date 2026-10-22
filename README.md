# PI5 — Monitoramento Inteligente de Nível da Água

Projeto Integrador 5 (PI5) — desenvolvimento de um sistema de monitoramento de nível da água, com aquisição de dados por sensores, envio de telemetria via Ethernet, armazenamento histórico e futura análise de situações de nível elevado e nível baixo.

> **Status:** reconstrução do software **do zero**. A arquitetura abaixo representa o plano aprovado, **não** funcionalidades já concluídas. O Arduino e alguns periféricos foram testados localmente em uma montagem anterior; **o Ethernet Shield W5100, a nova API NestJS e a persistência MongoDB ainda precisam ser implementados e validados**.

## Objetivos

- Coletar medições do nível da água e informações ambientais com um **Arduino Mega 2560**.
- Enviar leituras pela rede cabeada usando **Ethernet Shield W5100** e requisições HTTP `POST`.
- Desenvolver uma **API REST com NestJS e TypeScript** para receber, validar, consultar e armazenar medições.
- Persistir informações em **MongoDB**, com acesso por **Prisma ORM** (versão compatível com o conector MongoDB).
- Integrar previsões meteorológicas da **Open-Meteo**, considerando temperatura, chuva e probabilidade de precipitação.
- Criar futuramente um painel web em **Next.js** e recursos de alerta para níveis altos e baixos.
- Estudar séries históricas da **ANA/HidroWeb** como pesquisa separada para possíveis modelos preditivos.

## Arquitetura planejada

```text
[HC-SR04] [Sensor resistivo*] [DHT] [RTC] [Buzzer / Relé]
                       |
                Arduino Mega 2560
                     C++ (.ino)
                       |
                Ethernet Shield W5100
                       |
              HTTP POST /leituras
                       |
                API REST NestJS
             Controller + DTO + Service
                       |
                  Prisma ORM
                       |
                    MongoDB
                       ^
                       |
                  Next.js (futuro)

Open-Meteo -- HTTP GET --> Backend --> Previsões no MongoDB (futuro)
ANA/HidroWeb ------------> Estudos históricos em notebooks (paralelo)
```

\* O sensor resistivo será **complementar**, voltado a testes de detecção de contato com água. O **HC-SR04** permanece como medidor principal de distância até a superfície da água no protótipo.

**Decisão de projeto:** o Arduino **não** acessará o MongoDB diretamente. Enviará dados para o NestJS, que será responsável pela validação, deduplicação e persistência. As credenciais do banco permanecerão no servidor.

## Tecnologias

| Camada | Tecnologia | Papel |
|---|---|---|
| Hardware | Arduino Mega 2560 | Coleta e lógica local |
| Rede do dispositivo | Ethernet Shield W5100 | Comunicação por cabo Ethernet |
| Firmware | Arduino C++ (`SPI.h`, `Ethernet.h`) | Montagem do JSON e envio HTTP |
| Backend | NestJS + TypeScript | API REST, validação e regras de negócio |
| Persistência | MongoDB + Prisma ORM | Histórico e consultas |
| Meteorologia | Open-Meteo | Previsões horárias por latitude/longitude |
| Frontend (futuro) | Next.js | Dashboard de leituras, previsões e alertas |
| Pesquisa (paralela) | ANA/HidroWeb + Python | Análise histórica de cheias e estiagens |

## Organização de diretórios proposta

Esta estrutura será construída gradualmente. **As pastas e módulos listados não devem ser interpretados como já existentes.**

```text
ProjetoIntegrador5/
├── backend/                     # API NestJS
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── leituras/
│   │   │   ├── dto/
│   │   │   ├── leituras.controller.ts
│   │   │   ├── leituras.service.ts
│   │   │   └── leituras.module.ts
│   │   ├── prisma/              # Módulo e serviço de conexão
│   │   ├── previsoes-tempo/     # Integração meteorológica posterior
│   │   └── alertas/             # Regras de monitoramento posteriores
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env.example
├── hardware/
│   ├── arduino-pi5/
│   │   └── arduino-pi5.ino
│   └── esquemas/
├── frontend/                    # Aplicação Next.js futura
├── pesquisa-ana/
│   └── notebooks/
├── docs/
│   ├── contrato-leituras.md
│   ├── ligacoes-hardware.md
│   ├── arquitetura.md
│   └── testes-integracao.md
└── README.md
```

## Contrato inicial de comunicação

O firmware enviará um JSON para `POST /leituras`. **Este é um contrato proposto**, a ser implementado da mesma forma no Arduino, no DTO do NestJS e no modelo Prisma.

```json
{
  "idLeitura": "arduino-mega-01-20261020T210000-001",
  "idDispositivo": "arduino-mega-01",
  "timestampRtc": "2026-10-20T21:00:00-03:00",
  "distanciaAguaCm": 35.7,
  "temperaturaC": 24.5,
  "umidadePct": 65.0,
  "sensorAguaRaw": 480,
  "simulada": true
}
```

> Os valores do exemplo são **fictícios** e representam uma medição de teste.

| Campo | Descrição | Origem |
|---|---|---|
| `idLeitura` | Identificador estável da leitura; usado para evitar duplicidade em reenvios | Arduino |
| `idDispositivo` | Identificador da unidade de coleta | Arduino |
| `timestampRtc` | Data e hora da medição, com fuso explícito; opcional na primeira etapa | RTC |
| `distanciaAguaCm` | Distância medida até a superfície da água, em centímetros | HC-SR04 |
| `temperaturaC` | Temperatura ambiente em °C | DHT |
| `umidadePct` | Umidade relativa em % | DHT |
| `sensorAguaRaw` | Valor analógico bruto do sensor resistivo | Sensor complementar |
| `simulada` | Indica se os dados foram simulados nos testes | Firmware |
| `recebidoEm` | Horário de recebimento, gerado no servidor; **não é enviado pelo Arduino** | NestJS |

Os valores de sensores ainda ausentes podem ser opcionais no DTO inicial. **`distanciaAguaCm` não equivale diretamente ao nível da água**: para obter o nível em relação a uma referência física, precisaremos calibrar a instalação.

**Comportamento esperado:** o backend confirma o recebimento com um código HTTP apropriado e mantém `idLeitura` único. Uma retransmissão da mesma medição não deve criar um segundo documento.

## Plano de implementação

O trabalho será executado por etapas independentes, com testes de conclusão:

1. **Preparação:** organizar o repositório, preservar a documentação útil da versão Python e aprovar o contrato JSON.
2. **Backend mínimo:** criar projeto NestJS pelo CLI, gerar o resource `leituras`, implementar DTO e `POST /leituras` **sem banco**.
3. **Firmware simulado:** produzir JSON no Arduino, implementar envio HTTP `POST`, intervalo com `millis()` e tratamento básico de resposta/erros.
4. **Montagem e rede:** conectar Mega + W5100 ao roteador, validar IP e comunicação; integrar HC-SR04, DHT, RTC e sensor complementar progressivamente.
5. **Persistência:** configurar MongoDB/Prisma, modelar `Leitura`, registrar dados e impedir duplicações.
6. **Integração ponta a ponta:** validar Arduino → NestJS → MongoDB, inclusive reconexão e falhas de rede.
7. **Previsão meteorológica:** reimplementar consulta à Open-Meteo no NestJS, persistir previsões horárias e automatizar atualizações.
8. **Regras e alertas:** estudar limites e condições para identificar níveis altos e baixos, sem confundir chuva prevista com risco confirmado.
9. **Dashboard:** consumir endpoints no Next.js e visualizar leituras, histórico, previsões e alertas.
10. **Pesquisa histórica:** analisar os dados da ANA em notebooks, como frente separada, e avaliar possibilidades preditivas futuras.

### Primeira entrega planejada

> **`POST /leituras` funcionando no NestJS com JSON simulado enviado por Thunder Client**, antes de instalar MongoDB ou depender do Ethernet Shield.

## Iniciando o backend (quando a primeira tarefa começar)

Pré-requisitos: **Node.js em versão LTS compatível**, npm e Nest CLI (global ou via `npx`). Na raiz do repositório:

```bash
npx @nestjs/cli new backend
cd backend
npm run start:dev
```

Depois de conferir que o servidor iniciou, gerar a estrutura do recurso:

```bash
npx nest g resource leituras
```

Selecionar **REST API**. O Nest CLI criará os arquivos iniciais de módulo, controller, service, DTOs, entidade e testes. **Esses arquivos não implementam o contrato nem a persistência automaticamente**: isso será feito nas tarefas seguintes.

Na etapa de banco, utilizaremos um Prisma compatível com MongoDB, configurando `schema.prisma`, `DATABASE_URL` e o serviço de conexão. Não comitar `.env`, credenciais, tokens ou arquivos locais de configuração sensíveis.

## Histórico meteorológico e pesquisa ANA

A consulta meteorológica planejada usará `GET https://api.open-meteo.com/v1/forecast`, enviando **latitude e longitude para selecionar o ponto geográfico de interesse**, com previsão horária. O protótipo anterior em Python consultava três dias e as variáveis `temperature_2m`, `precipitation`, `precipitation_probability`, `rain` e `weather_code`. Essa integração será **reescrita no NestJS**, e a gravação periódica ainda será implementada.

Os estudos históricos usam arquivos obtidos da ANA/HidroWeb:

- Estação fluviométrica **Encantado (86720000)**: cotas e vazões do Rio Taquari.
- Estação pluviométrica **Encantado (2951010)**: precipitação histórica.
- Dados de qualidade da água: material complementar, não prioridade para a primeira análise.

O objetivo da pesquisa é investigar chuva acumulada, duração de períodos chuvosos e secos, e resposta do nível/vazão. **Cota de rio não é porcentagem de armazenamento de barragem**; os datasets históricos também não devem ser misturados automaticamente às leituras do protótipo.

## Cuidados técnicos

- **W5100 usa cabo Ethernet**, não Wi-Fi; o servidor precisa ser alcançável por endereço IP na rede.
- Durante os testes, restringir o HTTP à rede local de desenvolvimento. Não expor o endpoint de ingestão sem controles de segurança.
- A instalação próxima à água exigirá alimentação, proteção ambiental e validação elétrica adequadas. Os testes iniciais devem ser realizados em bancada e baixa tensão.
- O sensor resistivo exposto pode sofrer corrosão; seu valor bruto não deve ser convertido em centímetros sem calibração.
- Alertas reais de risco exigem referências e limites confiáveis. Nem chuva prevista isoladamente nem nível baixo do rio são provas automáticas de transbordamento ou racionamento.

## Referências

- [NestJS — Documentação](https://docs.nestjs.com/)
- [NestJS — Gerador de recursos](https://docs.nestjs.com/recipes/crud-generator)
- [Prisma — MongoDB](https://www.prisma.io/docs/orm/overview/databases/mongodb)
- [Arduino — Ethernet Library](https://docs.arduino.cc/libraries/ethernet/)
- [Open-Meteo — Forecast API](https://open-meteo.com/en/docs)
- [ANA — HidroWeb](https://www.snirh.gov.br/hidroweb/)

---

**Observação:** este repositório será desenvolvido incrementalmente no contexto do Projeto Integrador 5. O status de cada etapa deverá ser atualizado conforme a implementação e a validação real das funcionalidades.
