/*
 * PI5 - Arduino Mega 2560 + Ethernet Shield W5100
 * Contrato: docs/contrato-leituras.md (V1)
 *
 * Bibliotecas externas: Ethernet, DHT sensor library (Adafruit), RTClib (Adafruit).
 * Sem delay() nem pulseIn(): HC-SR04 usa interrupcao externa no ECHO e agenda com micros/millis.
 * HTTP e leitura DHT ainda possuem trechos bloqueantes curtos/limitados (ver documentacao).
 */

#include <SPI.h>
#include <Ethernet.h>
#include <Wire.h>
#include <RTClib.h>
#include <DHT.h>
#include <EEPROM.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// ---------------- CONFIGURACAO ----------------
const char* const ID_DISPOSITIVO = "arduino-mega-01";
const char* const FUSO_ISO8601 = "-03:00"; // RTC configurado para horario local UTC-3

// W5100: CS Ethernet D10; CS do leitor SD normalmente D4; SPI: 50, 51, 52 e SS 53.
const uint8_t PINO_ECHO = 2;       // interrupcao externa no Mega 2560
const uint8_t PINO_DHT = 3;
const uint8_t PINO_TRIG = 6;
const uint8_t PINO_RELE = 7;
const uint8_t PINO_BUZZER = 8;
const uint8_t PINO_SENSOR_RESISTIVO = A0;

#define TIPO_DHT DHT11 // Trocar para DHT22 se esse for o modelo utilizado

// Exemplos do prototipo anterior. Validar medidas antes de ativar o alarme.
const float ALTURA_RESERVATORIO_CM = 40.0;
const float LIMITE_CRITICO_CM = 35.0;
const bool ALTURA_REFERENCIA_VALIDADA = false; // Mudar para true so apos calibrar fisicamente
const bool RELE_ATIVO_EM_HIGH = true; // Confirmar se o modulo do rele e ativo em HIGH ou LOW

// Calibracao do sensor resistivo ainda nao realizada: manter valores invalidos.
// Medir o ADC com sensor seco e na altura maxima de referencia antes de preencher.
const int RESISTIVO_RAW_SECO_CALIBRADO = -1;
const int RESISTIVO_RAW_NIVEL_MAXIMO_CALIBRADO = -1;
const float ALTURA_SENSOR_RESISTIVO_CM = 0.0;

byte mac[] = { 0x02, 0x50, 0x49, 0x35, 0x00, 0x01 };
IPAddress IP_API(192, 168, 1, 100); // ALTERAR para o IP real do computador/servidor NestJS
const uint16_t PORTA_API = 3000;
const char* const ROTA_API = "/leituras";

// Opcional: definir a rede correta antes de ativar o IP fixo.
const bool USAR_IP_FIXO_SE_DHCP_FALHAR = false;
IPAddress IP_ARDUINO_FIXO(192, 168, 1, 177);
IPAddress DNS_REDE(192, 168, 1, 1);
IPAddress GATEWAY_REDE(192, 168, 1, 1);
IPAddress MASCARA_REDE(255, 255, 255, 0);

// Intervalos: 5 s para maquete. A proposta de 1 h para uso real precisa ser validada
// para o risco local; eventos de subida rapida podem exigir coleta mais frequente.
const unsigned long INTERVALO_ENVIO_MS = 5000UL;
const unsigned long INTERVALO_RETRY_REDE_MS = 30000UL;
const unsigned long TIMEOUT_HTTP_MS = 3000UL;
const unsigned long INTERVALO_ULTRASSOM_MS = 120UL; // HC-SR04: evitar disparos muito proximos
const unsigned long TIMEOUT_ECO_US = 30000UL;
const unsigned long INTERVALO_DHT_MS = 2500UL;
const unsigned long INTERVALO_RESISTIVO_MS = 500UL;
const unsigned long IDADE_MAX_DISTANCIA_MS = 1000UL;
const unsigned long IDADE_MAX_UMIDADE_MS = 6000UL;

DHT dht(PINO_DHT, TIPO_DHT);
RTC_DS3231 rtc; // Este codigo pressupoe DS3231; outro RTC exige ajuste de biblioteca.

bool ethernetPronto = false;
bool rtcPronto = false;
bool alarmeAtivo = false;

// ---------------- ESTADO DO HC-SR04 ----------------
enum EstadoUltra { ULTRA_OCIOSO, ULTRA_PULSO_TRIGGER, ULTRA_AGUARDANDO_ECO };
EstadoUltra estadoUltra = ULTRA_OCIOSO;

volatile unsigned long ecoInicioUs = 0;
volatile unsigned long ecoDuracaoUs = 0;
volatile bool ecoSubidaDetectada = false;
volatile bool ecoCompleto = false;

unsigned long triggerInicioUs = 0;
unsigned long inicioJanelaEcoUs = 0;
unsigned long ultimaDisparadaUltraMs = 0;

const uint8_t TAMANHO_FILTRO = 5;
float historicoDistancias[TAMANHO_FILTRO];
uint8_t indiceDistancia = 0;
uint8_t quantidadeDistancias = 0;
unsigned long ultimaDistanciaValidaMs = 0;

float umidadeAtualPct = NAN;
bool umidadeValida = false;
unsigned long ultimaLeituraDhtMs = 0;
unsigned long ultimaUmidadeValidaMs = 0;

int resistivoRawAtual = -1;
bool resistivoRawValido = false;
unsigned long ultimaLeituraResistivoMs = 0;

// Uma unica leitura pendente e mantida byte a byte em tentativas de retry.
bool envioPendente = false;
char payloadPendente[320];
uint8_t tentativasPayload = 0;
unsigned long ultimoEnvioGeradoMs = 0;
unsigned long ultimaTentativaHttpMs = 0;
unsigned long ultimaTentativaEthernetMs = 0;
unsigned long ultimoDiagnosticoMs = 0;

// Incremento persistente uma vez por boot + sequencia em RAM reduz colisao de IDs.
uint32_t contadorBoot = 0;
uint32_t contadorLeitura = 0;

// ---------------- INTERRUPCAO EXTERNA DO ECHO ----------------
void interrupcaoEco() {
  const bool alto = (digitalRead(PINO_ECHO) == HIGH);
  const unsigned long agoraUs = micros();

  if (alto) {
    ecoInicioUs = agoraUs;
    ecoSubidaDetectada = true;
  } else if (ecoSubidaDetectada) {
    ecoDuracaoUs = agoraUs - ecoInicioUs;
    ecoCompleto = true;
    ecoSubidaDetectada = false;
  }
}

// ---------------- ALERTA LOCAL ----------------
void definirAlarme(bool ativo) {
  if (ativo == alarmeAtivo) return;
  alarmeAtivo = ativo;

  digitalWrite(PINO_RELE, (ativo == RELE_ATIVO_EM_HIGH) ? HIGH : LOW);
  if (ativo) {
    tone(PINO_BUZZER, 1000);
    Serial.println(F("ALERTA LOCAL: nivel acima do limite configurado!"));
  } else {
    noTone(PINO_BUZZER);
    Serial.println(F("Alarme local desativado."));
  }
}

// ---------------- RTC E IDS ----------------
void inicializarContadorBoot() {
  EEPROM.get(0, contadorBoot);
  if (contadorBoot == 0xFFFFFFFFUL) contadorBoot = 0;
  contadorBoot++;
  if (contadorBoot == 0xFFFFFFFFUL) contadorBoot = 1;
  EEPROM.put(0, contadorBoot); // escrito uma vez por inicializacao, nao a cada leitura
  contadorLeitura = 0;
}

bool obterTimestampRtc(char* iso, size_t isoCap, char* compacto, size_t compactoCap) {
  if (!rtcPronto) return false;
  const DateTime agora = rtc.now();

  int n = snprintf(iso, isoCap, "%04d-%02d-%02dT%02d:%02d:%02d%s",
      agora.year(), agora.month(), agora.day(), agora.hour(), agora.minute(), agora.second(), FUSO_ISO8601);
  if (n < 0 || (size_t)n >= isoCap) return false;

  n = snprintf(compacto, compactoCap, "%04d%02d%02dT%02d%02d%02d",
      agora.year(), agora.month(), agora.day(), agora.hour(), agora.minute(), agora.second());
  return n >= 0 && (size_t)n < compactoCap;
}

void gerarIdLeitura(const char* timestampCompacto, char* destino, size_t capacidade) {
  contadorLeitura++;
  snprintf(destino, capacidade, "%s-%s-B%lu-S%lu",
      ID_DISPOSITIVO, timestampCompacto,
      (unsigned long)contadorBoot, (unsigned long)contadorLeitura);
}

// ---------------- HC-SR04: SEM pulseIn() / delay() ----------------
bool obterDistanciaMedia(float* destino) {
  if (quantidadeDistancias < 3) return false; // inicializa filtro com pelo menos 3 amostras
  if (millis() - ultimaDistanciaValidaMs > IDADE_MAX_DISTANCIA_MS) return false;

  float soma = 0.0;
  for (uint8_t i = 0; i < quantidadeDistancias; i++) soma += historicoDistancias[i];
  *destino = soma / quantidadeDistancias;
  return true;
}

void registrarEco(unsigned long duracaoUs) {
  if (duracaoUs == 0) return;
  const float distancia = (float)duracaoUs * 0.0343f / 2.0f;
  if (distancia < 2.0f || distancia > 400.0f) {
    Serial.println(F("Eco fora da faixa esperada."));
    return;
  }

  historicoDistancias[indiceDistancia] = distancia;
  indiceDistancia = (indiceDistancia + 1) % TAMANHO_FILTRO;
  if (quantidadeDistancias < TAMANHO_FILTRO) quantidadeDistancias++;
  ultimaDistanciaValidaMs = millis();

  float media;
  if (obterDistanciaMedia(&media) && ALTURA_REFERENCIA_VALIDADA && media <= ALTURA_RESERVATORIO_CM) {
    const float nivel = ALTURA_RESERVATORIO_CM - media;
    definirAlarme(nivel >= LIMITE_CRITICO_CM);
  }
}

void atualizarSensorUltrassonico() {
  const unsigned long agoraMs = millis();
  const unsigned long agoraUs = micros();

  if (estadoUltra == ULTRA_PULSO_TRIGGER) {
    if (agoraUs - triggerInicioUs >= 10UL) {
      digitalWrite(PINO_TRIG, LOW);
      inicioJanelaEcoUs = micros();
      estadoUltra = ULTRA_AGUARDANDO_ECO;
    }
    return;
  }

  if (estadoUltra == ULTRA_AGUARDANDO_ECO) {
    bool recebido = false;
    unsigned long duracao = 0;
    noInterrupts();
    if (ecoCompleto) {
      duracao = ecoDuracaoUs;
      ecoCompleto = false;
      recebido = true;
    }
    interrupts();

    if (recebido) {
      estadoUltra = ULTRA_OCIOSO;
      registrarEco(duracao);
      return;
    }

    if (agoraUs - inicioJanelaEcoUs >= TIMEOUT_ECO_US) {
      estadoUltra = ULTRA_OCIOSO;
      noInterrupts();
      ecoCompleto = false;
      ecoSubidaDetectada = false;
      interrupts();
      Serial.println(F("Timeout: sem eco do HC-SR04."));
    }
    return;
  }

  if (agoraMs - ultimaDisparadaUltraMs >= INTERVALO_ULTRASSOM_MS) {
    ultimaDisparadaUltraMs = agoraMs;
    noInterrupts();
    ecoCompleto = false;
    ecoSubidaDetectada = false;
    interrupts();

    digitalWrite(PINO_TRIG, LOW); // fica baixo enquanto espera o proximo disparo
    digitalWrite(PINO_TRIG, HIGH);
    triggerInicioUs = micros();
    estadoUltra = ULTRA_PULSO_TRIGGER;
  }
}

// ---------------- DHT: APENAS UMIDADE NO CONTRATO V1 ----------------
void atualizarDht() {
  const unsigned long agora = millis();
  if (estadoUltra != ULTRA_OCIOSO) return; // evita iniciar leitura durante janela de eco
  if (agora - ultimaLeituraDhtMs < INTERVALO_DHT_MS) return;
  ultimaLeituraDhtMs = agora;

  const float umidade = dht.readHumidity();
  if (!isnan(umidade) && umidade >= 0.0f && umidade <= 100.0f) {
    umidadeAtualPct = umidade;
    umidadeValida = true;
    ultimaUmidadeValidaMs = millis();
  } else {
    Serial.println(F("Falha na leitura de umidade do DHT."));
    if (millis() - ultimaUmidadeValidaMs > IDADE_MAX_UMIDADE_MS) umidadeValida = false;
  }
}

bool obterUmidade(float* destino) {
  if (!umidadeValida || millis() - ultimaUmidadeValidaMs > IDADE_MAX_UMIDADE_MS) return false;
  *destino = umidadeAtualPct;
  return true;
}

// ---------------- SENSOR RESISTIVO ----------------
void atualizarSensorResistivo() {
  if (millis() - ultimaLeituraResistivoMs < INTERVALO_RESISTIVO_MS) return;
  ultimaLeituraResistivoMs = millis();
  resistivoRawAtual = analogRead(PINO_SENSOR_RESISTIVO);
  resistivoRawValido = resistivoRawAtual >= 0 && resistivoRawAtual <= 1023;
}

bool obterNivelResistivo(float* destino) {
  if (!resistivoRawValido) return false;
  if (RESISTIVO_RAW_SECO_CALIBRADO < 0 || RESISTIVO_RAW_NIVEL_MAXIMO_CALIBRADO < 0 ||
      RESISTIVO_RAW_SECO_CALIBRADO == RESISTIVO_RAW_NIVEL_MAXIMO_CALIBRADO ||
      ALTURA_SENSOR_RESISTIVO_CM <= 0.0f) return false;

  const int minimo = min(RESISTIVO_RAW_SECO_CALIBRADO, RESISTIVO_RAW_NIVEL_MAXIMO_CALIBRADO);
  const int maximo = max(RESISTIVO_RAW_SECO_CALIBRADO, RESISTIVO_RAW_NIVEL_MAXIMO_CALIBRADO);
  if (resistivoRawAtual < minimo || resistivoRawAtual > maximo) return false;

  // Suporta sensores cujo valor ADC cresce OU decresce com a imersao.
  const float fracao = (float)(resistivoRawAtual - RESISTIVO_RAW_SECO_CALIBRADO) /
      (float)(RESISTIVO_RAW_NIVEL_MAXIMO_CALIBRADO - RESISTIVO_RAW_SECO_CALIBRADO);
  const float nivel = fracao * ALTURA_SENSOR_RESISTIVO_CM;
  if (nivel < 0.0f || nivel > ALTURA_SENSOR_RESISTIVO_CM) return false;
  *destino = nivel;
  return true;
}

// ---------------- JSON V1 ----------------
bool anexarCampoNumero(char* json, size_t capacidade, size_t* usado, const char* nome, float valor) {
  char numero[18];
  // dtostrf e preferivel a snprintf("%f") no AVR, onde float printf costuma estar desativado.
  dtostrf(valor, 1, 2, numero);
  if (*usado >= capacidade) return false;

  const int n = snprintf(json + *usado, capacidade - *usado, ",\"%s\":%s", nome, numero);
  if (n < 0 || (size_t)n >= capacidade - *usado) return false;
  *usado += (size_t)n;
  return true;
}

bool montarPayload(char* destino, size_t capacidade) {
  float distancia = 0, umidade = 0, nivelUltrassonico = 0, nivelResistivo = 0;
  const bool temDistancia = obterDistanciaMedia(&distancia);
  const bool temNivelUltrassonico = temDistancia && ALTURA_REFERENCIA_VALIDADA && distancia <= ALTURA_RESERVATORIO_CM;
  if (temNivelUltrassonico) nivelUltrassonico = ALTURA_RESERVATORIO_CM - distancia;
  const bool temNivelResistivo = obterNivelResistivo(&nivelResistivo);
  const bool temUmidade = obterUmidade(&umidade);

  // Contrato V1: pelo menos um campo de medicao deve estar presente.
  if (!temDistancia && !temNivelUltrassonico && !temNivelResistivo && !temUmidade) {
    Serial.println(F("Sem medicao valida; payload nao criado."));
    return false;
  }

  char timestamp[32], timestampCompacto[20];
  if (!obterTimestampRtc(timestamp, sizeof(timestamp), timestampCompacto, sizeof(timestampCompacto))) {
    Serial.println(F("RTC indisponivel; nao enviar timestamp inventado."));
    return false;
  }

  char idLeitura[72];
  gerarIdLeitura(timestampCompacto, idLeitura, sizeof(idLeitura));

  int n = snprintf(destino, capacidade,
      "{\"versao\":1,\"idDispositivo\":\"%s\",\"idLeitura\":\"%s\",\"timestampRtc\":\"%s\"}",
      ID_DISPOSITIVO, idLeitura, timestamp);
  if (n < 0 || (size_t)n >= capacidade) return false;

  // Retira o } final para acrescentar os campos opcionais.
  size_t usado = (size_t)n - 1;
  destino[usado] = '\0';

  if (temDistancia && !anexarCampoNumero(destino, capacidade, &usado, "distanciaCm", distancia)) return false;
  if (temNivelUltrassonico && !anexarCampoNumero(destino, capacidade, &usado, "nivelUltrassonicoCm", nivelUltrassonico)) return false;
  if (temNivelResistivo && !anexarCampoNumero(destino, capacidade, &usado, "nivelResistivoCm", nivelResistivo)) return false;
  if (temUmidade && !anexarCampoNumero(destino, capacidade, &usado, "umidadePct", umidade)) return false;

  if (usado + 2 > capacidade) return false;
  destino[usado++] = '}';
  destino[usado] = '\0';
  return true;
}

// ---------------- ETHERNET E HTTP ----------------
bool inicializarEthernet() {
  Serial.println(F("Inicializando Ethernet Shield..."));
  pinMode(4, OUTPUT);  // desativar CS do leitor SD, se existir
  digitalWrite(4, HIGH);
  pinMode(53, OUTPUT); // manter SPI do Mega como mestre
  digitalWrite(53, HIGH);
  Ethernet.init(10);   // CS do W5100

  if (Ethernet.begin(mac) != 0) {
    ethernetPronto = true;
    Serial.print(F("IP do Arduino: "));
    Serial.println(Ethernet.localIP());
    return true;
  }

  Serial.println(F("DHCP falhou."));
  if (USAR_IP_FIXO_SE_DHCP_FALHAR) {
    Ethernet.begin(mac, IP_ARDUINO_FIXO, DNS_REDE, GATEWAY_REDE, MASCARA_REDE);
    ethernetPronto = true;
    Serial.print(F("IP fixo do Arduino: "));
    Serial.println(Ethernet.localIP());
    return true;
  }

  ethernetPronto = false;
  Serial.println(F("Configure DHCP ou um IP fixo que corresponda a rede."));
  return false;
}

int enviarHttpPost(const char* json) {
  if (!ethernetPronto) return -1;
  EthernetClient conexao;

  Serial.println(F("Conectando a API NestJS..."));
  if (!conexao.connect(IP_API, PORTA_API)) {
    Serial.println(F("Falha na conexao TCP com a API."));
    conexao.stop();
    return -1;
  }

  conexao.print(F("POST "));
  conexao.print(ROTA_API);
  conexao.println(F(" HTTP/1.1"));
  conexao.print(F("Host: "));
  conexao.print(IP_API);
  conexao.print(':');
  conexao.println(PORTA_API);
  conexao.println(F("Content-Type: application/json"));
  conexao.print(F("Content-Length: "));
  conexao.println(strlen(json));
  conexao.println(F("Connection: close"));
  conexao.println();
  conexao.print(json);

  Serial.print(F("JSON enviado: "));
  Serial.println(json);

  char linhaStatus[64];
  size_t indice = 0;
  bool linhaStatusCompleta = false;
  const unsigned long inicio = millis();

  // Capturar primeira linha HTTP; drenar o restante sem guardar corpo, ate timeout/fechamento.
  while ((millis() - inicio) < TIMEOUT_HTTP_MS && (conexao.connected() || conexao.available())) {
    while (conexao.available()) {
      const char c = (char)conexao.read();
      if (linhaStatusCompleta) continue;
      if (c == '\r') continue;
      if (c == '\n') {
        linhaStatus[indice] = '\0';
        linhaStatusCompleta = true;
        continue;
      }
      if (indice < sizeof(linhaStatus) - 1) linhaStatus[indice++] = c;
    }
  }
  conexao.stop();

  if (!linhaStatusCompleta) {
    Serial.println(F("Sem linha de status HTTP completa."));
    return -1;
  }

  Serial.print(F("Resposta HTTP: "));
  Serial.println(linhaStatus);
  char* espaco = strchr(linhaStatus, ' ');
  if (espaco == NULL) return -1;
  return atoi(espaco + 1);
}

void gerenciarEnvio() {
  const unsigned long agora = millis();

  if (!envioPendente && agora - ultimoEnvioGeradoMs >= INTERVALO_ENVIO_MS) {
    ultimoEnvioGeradoMs = agora;
    if (montarPayload(payloadPendente, sizeof(payloadPendente))) {
      envioPendente = true;
      tentativasPayload = 0;
      ultimaTentativaHttpMs = 0;
    }
  }
  if (!envioPendente) return;

  if (!ethernetPronto && agora - ultimaTentativaEthernetMs >= INTERVALO_RETRY_REDE_MS) {
    ultimaTentativaEthernetMs = agora;
    inicializarEthernet();
  }
  if (!ethernetPronto) return;

  if (tentativasPayload > 0 && agora - ultimaTentativaHttpMs < INTERVALO_ENVIO_MS) return;
  ultimaTentativaHttpMs = millis();
  tentativasPayload++;

  const int status = enviarHttpPost(payloadPendente);
  if (status >= 200 && status < 300) {
    Serial.println(F("Leitura confirmada pela API (202 pode significar apenas recebimento em memoria)."));
    envioPendente = false;
  } else if (status >= 400 && status < 500 && status != 429) {
    Serial.println(F("Erro HTTP 4xx: pacote descartado; revisar contrato/rota/autorizacao."));
    envioPendente = false;
  } else {
    Serial.println(F("Envio nao confirmado; mesmo payload/ID sera tentado novamente."));
    // Mantem payloadPendente intacto para a proxima tentativa.
  }
}

void imprimirDiagnostico() {
  if (millis() - ultimoDiagnosticoMs < 1000UL) return;
  ultimoDiagnosticoMs = millis();

  Serial.print(F("Distancia media: "));
  float distancia;
  if (obterDistanciaMedia(&distancia)) {
    Serial.print(distancia, 2);
    Serial.print(F(" cm"));
  } else Serial.print(F("indisponivel"));

  Serial.print(F(" | Umidade: "));
  float umidade;
  if (obterUmidade(&umidade)) {
    Serial.print(umidade, 1);
    Serial.print(F("%"));
  } else Serial.print(F("indisponivel"));

  Serial.print(F(" | Sensor resistivo raw A0: "));
  if (resistivoRawValido) Serial.print(resistivoRawAtual);
  else Serial.print(F("indisponivel"));

  Serial.print(F(" | Alarme: "));
  Serial.print(alarmeAtivo ? F("ATIVO") : F("inativo"));
  if (!ALTURA_REFERENCIA_VALIDADA) Serial.print(F(" | referencia de nivel NAO calibrada"));
  Serial.println();
}

// ---------------- SETUP / LOOP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(PINO_TRIG, OUTPUT);
  digitalWrite(PINO_TRIG, LOW);
  pinMode(PINO_ECHO, INPUT);
  pinMode(PINO_RELE, OUTPUT);
  digitalWrite(PINO_RELE, RELE_ATIVO_EM_HIGH ? LOW : HIGH);
  pinMode(PINO_BUZZER, OUTPUT);
  noTone(PINO_BUZZER);
  pinMode(PINO_SENSOR_RESISTIVO, INPUT);

  dht.begin();
  Wire.begin();
  if (rtc.begin()) {
    rtcPronto = true;
    if (rtc.lostPower()) {
      Serial.println(F("RTC perdeu energia; ajustando para horario de compilacao."));
      // O relogio/fuso do computador usado para compilar deve estar correto.
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
  } else {
    rtcPronto = false;
    Serial.println(F("ERRO: RTC DS3231 nao encontrado."));
  }

  inicializarContadorBoot();
  attachInterrupt(digitalPinToInterrupt(PINO_ECHO), interrupcaoEco, CHANGE);
  inicializarEthernet();

  Serial.println(F("PI5 iniciado. Contrato JSON V1."));
  Serial.println(F("Payload V1: RTC, distancia/niveis calibrados e umidade."));
  Serial.println(F("Temperatura ambiente nao entra no JSON V1 atual."));
}

void loop() {
  // Sem delay(): as tarefas sao agendadas com millis()/micros().
  atualizarDht();
  atualizarSensorResistivo();
  atualizarSensorUltrassonico();
  imprimirDiagnostico();
  gerenciarEnvio();
}
