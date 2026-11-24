#pragma once
#include "Arduino.h"
struct IPAddress { IPAddress(int, int, int, int) {} };
enum { EthernetNoHardware, EthernetW5100, LinkOFF, LinkON };
static bool fakeConnect = false, fakeHang = false;
static unsigned int fakeConnections = 0;
static std::string fakeRequest, fakeResponse;
struct EthernetStub {
  void init(int) {}
  void begin(byte*, IPAddress) {}
  void setRetransmissionTimeout(int) {}
  void setRetransmissionCount(int) {}
  int hardwareStatus() { return EthernetW5100; }
  int linkStatus() { return LinkON; }
  IPAddress localIP() { return IPAddress(127,0,0,1); }
};
static EthernetStub Ethernet;
struct EthernetClient {
  size_t position = 0;
  void setConnectionTimeout(int) {}
  bool connect(IPAddress, int) { ++fakeConnections; fakeRequest.clear(); return fakeConnect; }
  bool connected() { return fakeHang || position < fakeResponse.size(); }
  int available() { return position < fakeResponse.size(); }
  int read() { return fakeResponse[position++]; }
  void stop() {}
  void print(const char* s) { fakeRequest += s; }
  void print(char c) { fakeRequest += c; }
  void print(IPAddress) { fakeRequest += "127.0.0.1"; }
  template<class T> void print(T n) { fakeRequest += std::to_string(n); }
  template<class T> void println(T s) { print(s); fakeRequest += "\r\n"; }
  void println() { fakeRequest += "\r\n"; }
};
