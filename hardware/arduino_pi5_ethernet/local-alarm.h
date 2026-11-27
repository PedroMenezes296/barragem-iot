#ifndef PI5_LOCAL_ALARM_H
#define PI5_LOCAL_ALARM_H

#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <math.h>

namespace LocalAlarm {
// Centésimos de cm evitam divergências nos limites por arredondamento float.
struct Config {
  uint16_t reference, dry, attention, flood;
  uint8_t enabled;
  uint16_t full;
  uint8_t version; // 0/1 = legado em cm; 2 = percentuais em centésimos.
};
inline bool valid(const Config& c) {
  return c.enabled <= 1 && c.reference > 200 && c.reference <= 40000 &&
    c.dry < c.attention && c.attention < c.flood &&
    (c.version == 2 ? c.full > 0 && c.full <= c.reference - 200 && c.flood <= 10000 :
      c.version <= 1 && c.flood <= c.reference - 200);
}
inline bool equal(const Config& a, const Config& b) {
  return a.reference == b.reference && a.dry == b.dry &&
    a.attention == b.attention && a.flood == b.flood && a.enabled == b.enabled &&
    a.full == b.full && a.version == b.version;
}
enum State { NO_DATA, DISABLED, NORMAL, DRY, ATTENTION, FLOOD };
struct Result {
  State state;
  int32_t level; // -1 = sem medição válida; zero continua válido.
  float percentage;
};
inline Result evaluate(const Config& c, float distanceCm, bool fresh) {
  Result r = {NO_DATA, -1, NAN};
  if (!valid(c) || !fresh || !isfinite(distanceCm) || distanceCm < 2 ||
      distanceCm > 400 || distanceCm > c.reference / 100.0f) return r;
  const int32_t distance = (int32_t)floorf(distanceCm * 100.0f + 0.5f);
  r.level = c.reference - distance;
  const uint16_t full = c.version == 2 ? c.full : c.flood;
  const uint32_t hundredths = ((uint32_t)r.level * 10000UL + full / 2) / full;
  r.percentage = c.version == 2 ? hundredths / 100.0f : NAN;
  const uint32_t value = c.version == 2 ? hundredths : (uint32_t)r.level;
  r.state = !c.enabled ? DISABLED : value <= c.dry ? DRY :
    value >= c.flood ? FLOOD : value >= c.attention ? ATTENTION : NORMAL;
  return r;
}
inline bool alarming(State state) {
  return state == DRY || state == ATTENTION || state == FLOOD;
}

// V2 em área independente preserva as duas cópias V1 durante a primeira gravação.
struct LegacyConfig {
  uint16_t reference, dry, attention, flood;
  uint8_t enabled;
};
struct LegacyRecord {
  uint32_t magic;
  uint8_t version;
  uint32_t generation;
  LegacyConfig config;
  char device[81];
  uint32_t checksum;
};
// A assinatura é escrita por último: uma escrita interrompida não apaga a cópia anterior.
struct Record {
  uint32_t magic;
  uint8_t version;
  uint32_t generation;
  Config config;
  char device[81];
  uint32_t checksum;
};
const uint32_t MAGIC = 0x35414C4DUL;
const int LEGACY_EEPROM_START = 16;
const int EEPROM_START = 512; // Bytes 0..3 pertencem ao contador de boot.
template<class R> inline uint32_t checksum(const R& r) {
  uint32_t crc = 0xFFFFFFFFUL;
  const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&r);
  for (size_t i = 0; i < offsetof(R, checksum); ++i) {
    crc ^= bytes[i];
    for (uint8_t bit = 0; bit < 8; ++bit)
      crc = (crc >> 1) ^ ((crc & 1) ? 0xEDB88320UL : 0);
  }
  return ~crc;
}
inline bool validRecord(const Record& r, const char* device) {
  return r.magic == MAGIC && r.version == 2 && valid(r.config) &&
    memchr(r.device, '\0', sizeof(r.device)) && strcmp(r.device, device) == 0 &&
    r.checksum == checksum(r);
}
template<class Memory> class Store {
 public:
  int8_t slot;
  uint32_t generation;
  Store() : slot(-1), generation(0) {}
  bool load(Memory& memory, const char* device, Config& config) {
    slot = -1;
    generation = 0;
    if (EEPROM_START + 2 * sizeof(Record) > (size_t)memory.length()) return false;
    for (int8_t i = 0; i < 2; ++i) {
      Record r;
      memory.get(EEPROM_START + i * sizeof(Record), r);
      if (validRecord(r, device) &&
          (slot < 0 || (int32_t)(r.generation - generation) > 0)) {
        config = r.config;
        generation = r.generation;
        slot = i;
      }
    }
    if (slot >= 0) return true;
    // Leitura do formato original, sem regravar nem alterar o contador de boot.
    bool found = false;
    for (int8_t i = 0; i < 2; ++i) {
      LegacyRecord r;
      memory.get(LEGACY_EEPROM_START + i * sizeof(LegacyRecord), r);
      Config legacy = {r.config.reference, r.config.dry, r.config.attention,
        r.config.flood, r.config.enabled, 0, 1};
      if (r.magic == MAGIC && r.version == 1 && valid(legacy) &&
        memchr(r.device, '\0', sizeof(r.device)) && strcmp(r.device, device) == 0 &&
        r.checksum == checksum(r) && (!found || (int32_t)(r.generation - generation) > 0)) {
        config = legacy;
        generation = r.generation;
        found = true;
      }
    }
    return found;
  }
  bool save(Memory& memory, const char* device, const Config& config) {
    if (!valid(config) || strlen(device) > 80 ||
        EEPROM_START + 2 * sizeof(Record) > (size_t)memory.length()) return false;
    Record r;
    memset(&r, 0, sizeof(r));
    r.magic = MAGIC;
    r.version = 2;
    r.generation = generation + 1;
    r.config = config;
    strcpy(r.device, device);
    r.checksum = checksum(r);
    const int8_t next = slot == 0 ? 1 : 0;
    const int address = EEPROM_START + next * sizeof(Record);
    const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&r);
    for (size_t i = 0; i < sizeof(r.magic); ++i) memory.update(address + i, 0);
    for (size_t i = sizeof(r.magic); i < sizeof(r); ++i) memory.update(address + i, bytes[i]);
    for (size_t i = 0; i < sizeof(r.magic); ++i) memory.update(address + i, bytes[i]);
    Record check;
    memory.get(address, check);
    if (!validRecord(check, device)) return false;
    slot = next;
    generation = r.generation;
    return true;
  }
};
}
#endif
