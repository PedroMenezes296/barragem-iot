#include <assert.h>
#include <iostream>
#include "../arduino_pi5_ethernet/arduino_pi5_ethernet.ino"
#undef assert
#define assert(condition) do { if (!(condition)) { std::cerr << "Failed: " << #condition << " at line " << __LINE__ << "\n"; std::exit(1); } } while (0)

const char* validJson = R"({"versao":2,"idDispositivo":"arduino-mega-01","ativo":true,"distanciaFundoCm":120,"alturaCheioCm":100,"secaPct":20,"atencaoPct":80,"inundacaoPct":95})";
void sample(float distance) {
  for (int i = 0; i < 5; ++i) historicoDistancias[i] = distance;
  quantidadeDistancias = 5;
  ultimaDistanciaValidaMs = millis();
  atualizarAlarmeLocal();
}
void resetRuntime() {
  configuracaoLocalValida = false;
  configuracaoLocal = {};
  armazenamentoAlarmes = LocalAlarm::Store<EEPROMClass>();
  quantidadeDistancias = 0;
  alarmeAtivo = false;
  falhaLocal = false;
  frequenciaBuzzer = fakeTone = 0;
  estadoUltra = ULTRA_OCIOSO;
}

void testRtcAndHumidityPayload() {
  char payload[320];
  rtcPronto = true;
  rtc.current = DateTime(2026, 11, 25, 17, 30, 42);
  sample(40);
  umidadeValida = true;
  umidadeAtualPct = 39;
  ultimaUmidadeValidaMs = millis();
  assert(montarPayload(payload, sizeof(payload)));
  assert(strstr(payload, "\"umidadePct\":39.00"));
  assert(strstr(payload, "\"timestampRtc\":\"2026-11-25T17:30:42-03:00\""));
  assert(strstr(payload, "arduino-mega-01-20261125T173042-B"));
  assert(!strstr(payload, "TESTESEMRTC"));
  assert(!strstr(payload, "2026-10-27"));
  assert(!strstr(payload, "nivelResistivoCm"));
  const std::string first = payload;
  rtc.current = DateTime(2026, 11, 25, 17, 30, 47);
  assert(montarPayload(payload, sizeof(payload)));
  assert(strstr(payload, "\"timestampRtc\":\"2026-11-25T17:30:47-03:00\""));
  assert(strstr(payload, "arduino-mega-01-20261125T173047-B"));
  assert(first != payload);

  // Zero e 100 sao leituras validas; ausencia e expiracao omitem o campo.
  umidadeAtualPct = 0;
  assert(montarPayload(payload, sizeof(payload)));
  assert(strstr(payload, "\"umidadePct\":0.00"));
  umidadeAtualPct = 100;
  assert(montarPayload(payload, sizeof(payload)));
  assert(strstr(payload, "\"umidadePct\":100.00"));
  umidadeValida = false;
  assert(montarPayload(payload, sizeof(payload)));
  assert(!strstr(payload, "umidadePct"));
  umidadeValida = true;
  ultimaUmidadeValidaMs = millis();
  fakeUs += (IDADE_MAX_UMIDADE_MS + 1) * 1000ULL;
  assert(montarPayload(payload, sizeof(payload)));
  assert(!strstr(payload, "umidadePct"));

  // Sem RTC nao criar pacote/ID nem iniciar HTTP; o alarme local continua.
  rtcPronto = false;
  const uint32_t previousSequence = contadorLeitura;
  assert(!montarPayload(payload, sizeof(payload)));
  assert(contadorLeitura == previousSequence);
  envioPendente = false;
  ethernetPronto = true;
  fakeConnect = false;
  estadoUltra = ULTRA_OCIOSO;
  ultimoEnvioGeradoMs = millis() - INTERVALO_ENVIO_MS;
  const unsigned int connections = fakeConnections;
  gerenciarEnvio();
  assert(!envioPendente && fakeConnections == connections);
  sample(10);
  assert(resultadoLocal.state == LocalAlarm::FLOOD && alarmeAtivo);

  // Reenvios mantem a medicao original, mesmo com novo horario/umidade.
  rtcPronto = true;
  rtc.current = DateTime(2026, 11, 25, 17, 31, 0);
  umidadeValida = true;
  umidadeAtualPct = 39;
  ultimaUmidadeValidaMs = millis();
  ultimoEnvioGeradoMs = millis() - INTERVALO_ENVIO_MS;
  estadoUltra = ULTRA_OCIOSO;
  gerenciarEnvio();
  assert(envioPendente && tentativasPayload == 1);
  const std::string pending = payloadPendente;
  const uint32_t pendingSequence = contadorLeitura;
  assert(pending.find("\"umidadePct\":39.00") != std::string::npos);
  assert(pending.find("2026-11-25T17:31:00-03:00") != std::string::npos);
  rtc.current = DateTime(2026, 11, 25, 17, 31, 5);
  umidadeAtualPct = 55;
  fakeUs += INTERVALO_ENVIO_MS * 1000ULL;
  gerenciarEnvio();
  assert(envioPendente && tentativasPayload == 2);
  assert(pending == payloadPendente && contadorLeitura == pendingSequence);
  fakeConnect = true;
  fakeResponse = "HTTP/1.1 201 Created\r\nContent-Length: 0\r\n\r\n";
  fakeUs += INTERVALO_ENVIO_MS * 1000ULL;
  gerenciarEnvio();
  assert(!envioPendente);
  assert(fakeRequest.find(pending) != std::string::npos);
}
int main() {
  // A primeira grava??o V2 nunca destr?i a configura??o original V1.
  {
    EEPROMClass legacyMemory;
    LocalAlarm::LegacyRecord old;
    memset(&old, 0, sizeof(old));
    old.magic = LocalAlarm::MAGIC; old.version = 1; old.generation = 1;
    old.config = {10000,1600,7200,8000,1};
    strcpy(old.device, ID_DISPOSITIVO);
    old.checksum = LocalAlarm::checksum(old);
    legacyMemory.put(LocalAlarm::LEGACY_EEPROM_START, old);
    uint32_t boot = 1234; legacyMemory.put(0, boot);
    LocalAlarm::Store<EEPROMClass> store;
    LocalAlarm::Config loaded;
    assert(store.load(legacyMemory, ID_DISPOSITIVO, loaded));
    assert(loaded.version == 1);
    assert(LocalAlarm::evaluate(loaded, 28, true).state == LocalAlarm::ATTENTION);
    assert(isnan(LocalAlarm::evaluate(loaded, 28, true).percentage));
    const LocalAlarm::Config migrated = {12000,2000,8000,9500,1,10000,2};
    for (size_t cut = 0; cut < sizeof(LocalAlarm::Record) + 10; ++cut) {
      EEPROMClass interrupted = legacyMemory;
      LocalAlarm::Store<EEPROMClass> writing;
      assert(writing.load(interrupted, ID_DISPOSITIVO, loaded));
      interrupted.untilPowerCut = cut;
      try { writing.save(interrupted, ID_DISPOSITIVO, migrated); } catch (const std::runtime_error&) {}
      LocalAlarm::Store<EEPROMClass> restarted;
      assert(restarted.load(interrupted, ID_DISPOSITIVO, loaded));
      assert(loaded.version == 1 || loaded.version == 2);
      assert(loaded.flood == (loaded.version == 1 ? 8000 : 9500));
      uint32_t savedBoot; interrupted.get(0, savedBoot); assert(savedBoot == boot);
      LocalAlarm::LegacyRecord untouched; interrupted.get(LocalAlarm::LEGACY_EEPROM_START, untouched);
      assert(memcmp(&old, &untouched, sizeof(old)) == 0);
    }
  }
  resetRuntime();
  assert(!armazenamentoAlarmes.load(EEPROM, ID_DISPOSITIVO, configuracaoLocal));
  atualizarAlarmeLocal();
  assert(falhaLocal && fakeTone == 2000 && !alarmeAtivo);
  assert(aplicarConfiguracaoAlarmes(validJson));
  assert(configuracaoLocalValida);
  const int writes = EEPROM.writes;
  assert(aplicarConfiguracaoAlarmes(validJson));
  assert(EEPROM.writes == writes); // Polling não desgasta a EEPROM.
  uint32_t boot = 1234;
  EEPROM.put(0, boot);

  const float distances[] = {120,100.01f,100,99.99f,40.01f,40,25.01f,25,20,10};
  const int levels[] = {0,1999,2000,2001,7999,8000,9499,9500,10000,11000};
  const float percentages[] = {0,19.99f,20,20.01f,79.99f,80,94.99f,95,100,110};
  const LocalAlarm::State states[] = {LocalAlarm::DRY,LocalAlarm::DRY,LocalAlarm::DRY,LocalAlarm::NORMAL,LocalAlarm::NORMAL,
    LocalAlarm::ATTENTION,LocalAlarm::ATTENTION,LocalAlarm::FLOOD,LocalAlarm::FLOOD,LocalAlarm::FLOOD};
  for (size_t i = 0; i < sizeof(distances)/sizeof(float); ++i) {
    sample(distances[i]);
    assert(resultadoLocal.level == levels[i]);
    assert(fabs(resultadoLocal.percentage - percentages[i]) < 0.001);
    assert(resultadoLocal.state == states[i]);
    assert(alarmeAtivo == LocalAlarm::alarming(states[i]));
  }
  const LocalAlarm::Config rounding = {25000,2000,8000,9500,1,20000,2};
  assert(fabs(LocalAlarm::evaluate(rounding, 244.65f, true).percentage - 2.68f) < 0.001);
  // Sem rede, novas medições continuam acionando E desativando o alarme.
  fakeConnect = false;
  ethernetPronto = true;
  primeiraConsultaConfig = true;
  estadoUltra = ULTRA_OCIOSO;
  sincronizarConfiguracaoAlarmes();
  assert(fakeConnections == 1);
  sample(50); assert(!alarmeAtivo);
  sample(15); assert(alarmeAtivo && fakeTone == 1000);
  fakeUs += 2000000;
  atualizarAlarmeLocal();
  assert(falhaLocal && alarmeAtivo && fakeTone == 1000);
  sample(50); assert(!falhaLocal && !alarmeAtivo && fakeTone == 0);
  fakeUs += 2000000;
  atualizarAlarmeLocal(); assert(falhaLocal && fakeTone == 2000);
  fakeUs += 150000;
  atualizarAlarmeLocal(); assert(fakeTone == 0);
  fakeUs += 100000;
  atualizarAlarmeLocal(); assert(fakeTone == 2000);
  sample(NAN); assert(falhaLocal && resultadoLocal.level == -1);
  sample(1.99f); assert(falhaLocal);
  sample(120.01f); assert(falhaLocal);
  assert(!aplicarConfiguracaoAlarmes("{\"idDispositivo\":\"other\",\"ativo\":true}"));
  assert(!aplicarConfiguracaoAlarmes("{\"idDispositivo\":\"arduino-mega-01\",\"ativo\":false,\"distanciaFundoCm\":null}"));
  assert(!aplicarConfiguracaoAlarmes("{\"idDispositivo\":\"arduino-mega-01\",\"ativo\":true,\"distanciaFundoCm\":100,\"secaCm\":16,\"atencaoCm\":80,\"inundacaoCm\":72}"));
  assert(EEPROM.writes == writes + 4); // Somente o contador de boot mudou.

  // Reinício offline recupera a configuração e preserva o contador.
  resetRuntime();
  configuracaoLocalValida = armazenamentoAlarmes.load(EEPROM, ID_DISPOSITIVO, configuracaoLocal);
  assert(configuracaoLocalValida);
  sample(40); assert(alarmeAtivo && resultadoLocal.percentage == 80);
  uint32_t savedBoot; EEPROM.get(0, savedBoot); assert(savedBoot == boot);
  auto disabled = configuracaoLocal; disabled.enabled = 0;
  assert(armazenamentoAlarmes.save(EEPROM, ID_DISPOSITIVO, disabled));
  resetRuntime();
  configuracaoLocalValida = armazenamentoAlarmes.load(EEPROM, ID_DISPOSITIVO, configuracaoLocal);
  assert(configuracaoLocalValida && !configuracaoLocal.enabled);
  sample(15); assert(!alarmeAtivo && fakeTone == 0);
  fakeUs += 2000000; atualizarAlarmeLocal(); assert(fakeTone == 0);
  // Reativação e desativação reais pelo JSON, incluindo alarme latched sem sensor.
  assert(aplicarConfiguracaoAlarmes(validJson));
  sample(15); assert(alarmeAtivo);
  fakeUs += 2000000; atualizarAlarmeLocal(); assert(falhaLocal && alarmeAtivo);
  std::string disabledJson = validJson;
  disabledJson.replace(disabledJson.find("true"), 4, "false");
  assert(aplicarConfiguracaoAlarmes(disabledJson.c_str()));
  assert(!alarmeAtivo && fakeTone == 0);

  // Simula corte de energia em cada byte alterado da gravação seguinte.
  const EEPROMClass original = EEPROM;
  for (int cut = 0; cut < 130; ++cut) {
    EEPROMClass interrupted = original;
    LocalAlarm::Store<EEPROMClass> store;
    LocalAlarm::Config loaded;
    assert(store.load(interrupted, ID_DISPOSITIVO, loaded));
    auto changed = loaded; changed.flood = 9600;
    interrupted.untilPowerCut = cut;
    try { store.save(interrupted, ID_DISPOSITIVO, changed); } catch (const std::runtime_error&) {}
    LocalAlarm::Store<EEPROMClass> restarted;
    assert(restarted.load(interrupted, ID_DISPOSITIVO, loaded));
    assert(loaded.flood == 9500 || loaded.flood == 9600);
  }
  EEPROMClass corrupt = original;
  LocalAlarm::Store<EEPROMClass> store;
  LocalAlarm::Config loaded;
  assert(store.load(corrupt, ID_DISPOSITIVO, loaded));
  corrupt.bytes[LocalAlarm::EEPROM_START + store.slot * sizeof(LocalAlarm::Record) + offsetof(LocalAlarm::Record, config)] ^= 1;
  assert(store.load(corrupt, ID_DISPOSITIVO, loaded)); // Recupera a cópia anterior.
  memset(corrupt.bytes + LocalAlarm::EEPROM_START, 0, 2 * sizeof(LocalAlarm::Record));
  assert(!store.load(corrupt, ID_DISPOSITIVO, loaded));
  assert(!store.load(EEPROM, "other", loaded));

  // Sincronização funciona sem POST pendente e respeita a cadência de dez segundos.
  resetRuntime();
  fakeConnect = true;
  fakeResponse = std::string("HTTP/1.0 200 OK\r\nContent-Type: application/json\r\n\r\n") + validJson;
  primeiraConsultaConfig = true;
  envioPendente = false;
  const unsigned int beforeConnections = fakeConnections;
  sincronizarConfiguracaoAlarmes();
  assert(configuracaoLocalValida && configuracaoLocal.enabled);
  assert(fakeConnections == beforeConnections + 1);
  const int unchangedWrites = EEPROM.writes;
  estadoUltra = ULTRA_OCIOSO;
  sincronizarConfiguracaoAlarmes();
  assert(fakeConnections == beforeConnections + 1);
  fakeUs += 10000000;
  estadoUltra = ULTRA_OCIOSO;
  sincronizarConfiguracaoAlarmes();
  assert(fakeConnections == beforeConnections + 2 && EEPROM.writes == unchangedWrites);

  resetRuntime();
  configuracaoLocalValida = armazenamentoAlarmes.load(EEPROM, ID_DISPOSITIVO, configuracaoLocal);
  assert(aplicarConfiguracaoAlarmes(validJson));
  sample(50);
  // A API aceita TCP, mas nunca responde; o sensor segue sendo atendido no timeout HTTP.
  fakeConnect = fakeHang = true;
  fakeResponse.clear();
  const uint64_t start = fakeUs;
  fakeTick = []() {
    if (estadoUltra == ULTRA_AGUARDANDO_ECO) {
      ecoDuracaoUs = 875; // Aproximadamente 15 cm -> inundação.
      ecoCompleto = true;
    }
  };
  estadoUltra = ULTRA_OCIOSO;
  primeiraConsultaConfig = true;
  sincronizarConfiguracaoAlarmes();
  fakeTick = NULL; fakeHang = false;
  assert(fakeUs - start >= (TIMEOUT_HTTP_MS - 1) * 1000);
  assert(alarmeAtivo && !falhaLocal && resultadoLocal.percentage > 100);
  assert(fakeRequest.find("GET /alertas/configuracao") == 0);
  char payload[320];
  rtcPronto = true;
  assert(montarPayload(payload, sizeof(payload)));
  assert(strstr(payload, "\"distanciaCm\""));
  assert(!strstr(payload, "nivelUltrassonicoCm"));
  assert(!strstr(payload, "percentual"));
  assert(!strstr(payload, "alarmeAtivo"));
  // Backend antigo continua funcionando até o usuário salvar a conversão.
  assert(aplicarConfiguracaoAlarmes(R"({"idDispositivo":"arduino-mega-01","ativo":true,"distanciaFundoCm":100,"secaCm":16,"atencaoCm":72,"inundacaoCm":80})"));
  sample(28); assert(resultadoLocal.state == LocalAlarm::ATTENTION && isnan(resultadoLocal.percentage));
  const auto legacy = configuracaoLocal;
  assert(!aplicarConfiguracaoAlarmes(R"({"versao":3,"idDispositivo":"arduino-mega-01","ativo":true})"));
  assert(LocalAlarm::equal(legacy, configuracaoLocal));
  assert(aplicarConfiguracaoAlarmes(validJson));
  assert(quantidadeDistancias == 0);
  sample(40); assert(resultadoLocal.percentage == 80 && resultadoLocal.state == LocalAlarm::ATTENTION);
  testRtcAndHumidityPayload();
  std::cout << "Firmware: formulas, limites, offline, HTTP timeout, EEPROM/reinicio/corrupcao/corte de energia, buzzer, RTC, umidade e reenvios OK.\n";
}
