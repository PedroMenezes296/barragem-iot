#pragma once
#include "Arduino.h"
struct EEPROMClass {
  uint8_t bytes[4096];
  int writes = 0, untilPowerCut = -1;
  EEPROMClass() { memset(bytes, 255, sizeof(bytes)); }
  int length() { return sizeof(bytes); }
  template<class T> void get(int address, T& value) { memcpy(&value, bytes + address, sizeof(T)); }
  template<class T> void put(int address, const T& value) {
    const uint8_t* p = reinterpret_cast<const uint8_t*>(&value);
    for (size_t i = 0; i < sizeof(T); ++i) update(address + i, p[i]);
  }
  void update(int address, uint8_t value) {
    if (bytes[address] == value) return;
    if (untilPowerCut == 0) throw std::runtime_error("power cut");
    if (untilPowerCut > 0) --untilPowerCut;
    bytes[address] = value; ++writes;
  }
};
static EEPROMClass EEPROM;
