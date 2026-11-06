"use client";

interface DeviceSelectorProps {
  ariaLabel: string;
  value?: string;
  defaultValue?: string;
  onChange?: (deviceId: string) => void;
}

const DEVICES = ["arduino-mega-01"];

export default function DeviceSelector({ ariaLabel, value, defaultValue = DEVICES[0], onChange }: DeviceSelectorProps) {
  return (
    <select aria-label={ariaLabel} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={(event) => onChange?.(event.target.value)}>
      {DEVICES.map((device) => <option key={device} value={device}>{device}</option>)}
    </select>
  );
}
