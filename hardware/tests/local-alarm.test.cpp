#include <assert.h>
#include <iostream>
#include "../arduino_pi5_ethernet/arduino_pi5_ethernet.ino"
#undef assert
#define assert(condition) do { if (!(condition)) { std::cerr << "Failed: " << #condition << " at line " << __LINE__ << "\n"; std::exit(1); } } while (0)

const char* validJson = "{\"idDispositivo\":\"arduino-mega-01\",\"ativo\":true,\"distanciaFundoCm\":100,\"secaCm\":16,\"atencaoCm\":72,\"inundacaoCm\":80}";
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
int main() {
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

  const float distances[] = {100,84,83.99f,28.01f,28,20.01f,20,15,2};
  const int levels[] = {0,1600,1601,7199,7200,7999,8000,8500,9800};
  const float percentages[] = {0,20,20.01f,89.99f,90,99.99f,100,106.25f,122.5f};
  const LocalAlarm::State states[] = {LocalAlarm::DRY,LocalAlarm::DRY,LocalAlarm::NORMAL,LocalAlarm::NORMAL,
    LocalAlarm::ATTENTION,LocalAlarm::ATTENTION,LocalAlarm::FLOOD,LocalAlarm::FLOOD,LocalAlarm::FLOOD};
  for (size_t i = 0; i < sizeof(distances)/sizeof(float); ++i) {
    sample(distances[i]);
    assert(resultadoLocal.level == levels[i]);
    assert(fabs(resultadoLocal.percentage - percentages[i]) < 0.001);
    assert(resultadoLocal.state == states[i]);
    assert(alarmeAtivo == LocalAlarm::alarming(states[i]));
  }
  const LocalAlarm::Config rounding = {25000,100,18000,20000,1};
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
  sample(100.01f); assert(falhaLocal);
  assert(!aplicarConfiguracaoAlarmes("{\"idDispositivo\":\"other\",\"ativo\":true}"));
  assert(!aplicarConfiguracaoAlarmes("{\"idDispositivo\":\"arduino-mega-01\",\"ativo\":false,\"distanciaFundoCm\":null}"));
  assert(!aplicarConfiguracaoAlarmes("{\"idDispositivo\":\"arduino-mega-01\",\"ativo\":true,\"distanciaFundoCm\":100,\"secaCm\":16,\"atencaoCm\":80,\"inundacaoCm\":72}"));
  assert(EEPROM.writes == writes + 4); // Somente o contador de boot mudou.

  // Reinício offline recupera a configuração e preserva o contador.
  resetRuntime();
  configuracaoLocalValida = armazenamentoAlarmes.load(EEPROM, ID_DISPOSITIVO, configuracaoLocal);
  assert(configuracaoLocalValida);
  sample(28); assert(alarmeAtivo && resultadoLocal.percentage == 90);
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
    auto changed = loaded; changed.flood = 8100;
    interrupted.untilPowerCut = cut;
    try { store.save(interrupted, ID_DISPOSITIVO, changed); } catch (const std::runtime_error&) {}
    LocalAlarm::Store<EEPROMClass> restarted;
    assert(restarted.load(interrupted, ID_DISPOSITIVO, loaded));
    assert(loaded.flood == 8000 || loaded.flood == 8100);
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
  assert(montarPayload(payload, sizeof(payload)));
  assert(strstr(payload, "\"distanciaCm\""));
  assert(!strstr(payload, "nivelUltrassonicoCm"));
  assert(!strstr(payload, "percentual"));
  assert(!strstr(payload, "alarmeAtivo"));
  std::cout << "Firmware: formulas, limites, offline, HTTP timeout, EEPROM/reinicio/corrupcao/corte de energia, buzzer e payload OK.\n";
}
