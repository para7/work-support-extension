import type { AppSettings, TimerState, WhitelistEntry } from "./types";

export const DEFAULT_WHITELIST: WhitelistEntry[] = [
  { pattern: "google.com" },
  { pattern: "google.co.jp" },
  { pattern: "bing.com" },
  { pattern: "duckduckgo.com" },
  { pattern: "yahoo.co.jp" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  whitelist: DEFAULT_WHITELIST,
};

export const INITIAL_TIMER_STATE: TimerState = {
  status: "idle",
  endTime: null,
  duration: null,
};

export const DURATION_PRESETS = [30, 60, 90] as const;

export const ALARM_NAME = "block-web-timer";
export const ALARM_CHECK_NAME = "block-web-check";

export const STORAGE_KEYS = {
  TIMER_STATE: "timerState",
  SETTINGS: "settings",
} as const;
