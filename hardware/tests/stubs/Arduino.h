#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <algorithm>
#include <string>
#include <stdexcept>
using std::min;
using std::max;
typedef uint8_t byte;
#define F(x) x
#define HIGH 1
#define LOW 0
#define OUTPUT 1
#define INPUT 0
#define CHANGE 1
#define A0 54
static uint64_t fakeUs = 0;
static void (*fakeTick)() = NULL;
static bool inTick = false;
static unsigned int fakeTone = 0;
static int fakeRelay = LOW;
inline void tick() {
  fakeUs += 100;
  if (fakeTick && !inTick) { inTick = true; fakeTick(); inTick = false; }
}
inline unsigned long millis() { tick(); return (uint32_t)(fakeUs / 1000); }
inline unsigned long micros() { tick(); return (uint32_t)fakeUs; }
inline void pinMode(int, int) {}
inline void digitalWrite(int pin, int value) { if (pin == 7) fakeRelay = value; }
inline int digitalRead(int) { return LOW; }
inline int analogRead(int) { return 0; }
inline void noInterrupts() {}
inline void interrupts() {}
inline int digitalPinToInterrupt(int p) { return p; }
inline void attachInterrupt(int, void (*)(), int) {}
inline void tone(int, unsigned int f) { fakeTone = f; }
inline void noTone(int) { fakeTone = 0; }
inline char* dtostrf(double value, signed char width, unsigned char precision, char* out) {
  sprintf(out, "%*.*f", width, precision, value); return out;
}
struct SerialStub {
  void begin(int) {}
  template<class T> void print(const T&) {}
  template<class T> void print(const T&, int) {}
  template<class T> void println(const T&) {}
  void println() {}
};
static SerialStub Serial;
