#pragma once
struct DateTime {
  int yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue;
  DateTime(int year = 2026, int month = 11, int day = 23, int hour = 12, int minute = 0, int second = 0)
    : yearValue(year), monthValue(month), dayValue(day), hourValue(hour), minuteValue(minute), secondValue(second) {}
  DateTime(const char*, const char*) : DateTime() {}
  int year() const { return yearValue; }
  int month() const { return monthValue; }
  int day() const { return dayValue; }
  int hour() const { return hourValue; }
  int minute() const { return minuteValue; }
  int second() const { return secondValue; }
};
struct RTC_DS3231 {
  DateTime current;
  bool begin() { return true; }
  bool lostPower() { return false; }
  void adjust(DateTime) {}
  DateTime now() { return current; }
};
