#pragma once
struct DateTime {
  DateTime() {}
  DateTime(const char*, const char*) {}
  int year() const { return 2026; }
  int month() const { return 11; }
  int day() const { return 23; }
  int hour() const { return 12; }
  int minute() const { return 0; }
  int second() const { return 0; }
};
struct RTC_DS3231 {
  bool begin() { return true; }
  bool lostPower() { return false; }
  void adjust(DateTime) {}
  DateTime now() { return DateTime(); }
};
