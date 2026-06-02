import type { CancelPolicy, TimerState } from "./types";
import { INITIAL_TIMER_STATE } from "./config";

export function createTimerState(
  durationMinutes: number,
  cancelPolicy: CancelPolicy,
  now: number = Date.now(),
): TimerState {
  return {
    status: "running",
    endTime: now + durationMinutes * 60 * 1000,
    duration: durationMinutes,
    cancelPolicy,
    cancelRequestedAt: null,
  };
}

export function isTimerActive(state: TimerState): boolean {
  return state.status === "running" || state.status === "cancelling";
}

export function isTimerExpired(state: TimerState, now: number = Date.now()): boolean {
  if (state.status !== "running" && state.status !== "cancelling") return false;
  return state.endTime !== null && now >= state.endTime;
}

export function getRemainingMs(state: TimerState, now: number = Date.now()): number {
  if (state.endTime === null) return 0;
  return Math.max(0, state.endTime - now);
}

export function canRequestCancel(state: TimerState): boolean {
  if (state.status !== "running") return false;
  return state.cancelPolicy !== "none";
}

export function requestCancel(
  state: TimerState,
  now: number = Date.now(),
): TimerState {
  if (!canRequestCancel(state)) return state;

  if (state.cancelPolicy === "immediate") {
    return resetTimer();
  }

  return {
    ...state,
    status: "cancelling",
    cancelRequestedAt: now,
  };
}

export function isCooldownComplete(
  state: TimerState,
  cooldownMinutes: number,
  now: number = Date.now(),
): boolean {
  if (state.status !== "cancelling" || state.cancelRequestedAt === null) return false;
  return now >= state.cancelRequestedAt + cooldownMinutes * 60 * 1000;
}

export function getCooldownRemainingMs(
  state: TimerState,
  cooldownMinutes: number,
  now: number = Date.now(),
): number {
  if (state.status !== "cancelling" || state.cancelRequestedAt === null) return 0;
  const cooldownEnd = state.cancelRequestedAt + cooldownMinutes * 60 * 1000;
  return Math.max(0, cooldownEnd - now);
}

export function cancelCancelRequest(state: TimerState): TimerState {
  if (state.status !== "cancelling") return state;
  return {
    ...state,
    status: "running",
    cancelRequestedAt: null,
  };
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
