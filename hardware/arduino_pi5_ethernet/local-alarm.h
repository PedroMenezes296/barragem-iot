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
};
inline bool valid(const Config& c) {
  return c.enabled <= 1 && c.reference > 200 && c.reference <= 40000 &&
    c.dry < c.attention && c.attention < c.flood && c.flood <= c.reference - 200;
}
inline bool equal(const Config& a, const Config& b) {
  return a.reference == b.reference && a.dry == b.dry &&
    a.attention == b.attention && a.flood == b.flood && a.enabled == b.enabled;
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
  const uint32_t hundredths = ((uint32_t)r.level * 10000UL + c.flood / 2) / c.flood;
  r.percentage = hundredths / 100.0f; // Não limitar a 100%.
  r.state = !c.enabled ? DISABLED : r.level <= c.dry ? DRY :
    r.level >= c.flood ? FLOOD : r.level >= c.attention ? ATTENTION : NORMAL;
  return r;
}
inline bool alarming(State state) {
  return state == DRY || state == ATTENTION || state == FLOOD;
}

// Duas cópias, a partir do byte 16. Bytes 0..3 pertencem ao contador de boot.
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
const int EEPROM_START = 16;
inline uint32_t checksum(const Record& r) {
  uint32_t crc = 0xFFFFFFFFUL;
  const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&r);
  for (size_t i = 0; i < offsetof(Record, checksum); ++i) {
    crc ^= bytes[i];
    for (uint8_t bit = 0; bit < 8; ++bit)
      crc = (crc >> 1) ^ ((crc & 1) ? 0xEDB88320UL : 0);
  }
  return ~crc;
}
inline bool validRecord(const Record& r, const char* device) {
  return r.magic == MAGIC && r.version == 1 && valid(r.config) &&
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
    return slot >= 0;
  }
  bool save(Memory& memory, const char* device, const Config& config) {
    if (!valid(config) || strlen(device) > 80 ||
        EEPROM_START + 2 * sizeof(Record) > (size_t)memory.length()) return false;
    Record r;
    memset(&r, 0, sizeof(r));
    r.magic = MAGIC;
    r.version = 1;
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
