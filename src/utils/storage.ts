import type { AppSettings, TimerState } from "@/core/types";
import { DEFAULT_SETTINGS, INITIAL_TIMER_STATE, STORAGE_KEYS } from "@/core/config";

export async function getTimerState(): Promise<TimerState> {
  const result = await browser.storage.local.get(STORAGE_KEYS.TIMER_STATE);
  return (result[STORAGE_KEYS.TIMER_STATE] as TimerState) ?? { ...INITIAL_TIMER_STATE };
}

export async function setTimerState(state: TimerState): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.TIMER_STATE]: state });
}

export async function getSettings(): Promise<AppSettings> {
  const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
  return (result[STORAGE_KEYS.SETTINGS] as AppSettings) ?? { ...DEFAULT_SETTINGS };
}

export async function setSettings(settings: AppSettings): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

export async function updateSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await setSettings(updated);
  return updated;
}
