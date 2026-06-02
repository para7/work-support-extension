import type { TimerState } from "./types";
import { INITIAL_TIMER_STATE } from "./config";

export function createTimerState(
  durationMinutes: number,
  now: number = Date.now(),
): TimerState {
  return {
    status: "running",
    endTime: now + durationMinutes * 60 * 1000,
    duration: durationMinutes,
  };
}

export function isTimerActive(state: TimerState): boolean {
  return state.status === "running";
}

export function isTimerExpired(state: TimerState, now: number = Date.now()): boolean {
  if (state.status !== "running") return false;
  return state.endTime !== null && now >= state.endTime;
}

export function getRemainingMs(state: TimerState, now: number = Date.now()): number {
  if (state.endTime === null) return 0;
  return Math.max(0, state.endTime - now);
}

export function resetTimer(): TimerState {
  return { ...INITIAL_TIMER_STATE };
}

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
