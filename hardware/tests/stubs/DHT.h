#pragma once
#define DHT11 11
struct DHT {
  DHT(int, int) {}
  void begin() {}
  float readHumidity() { return NAN; }
};
