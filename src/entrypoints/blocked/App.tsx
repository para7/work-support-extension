import { useState, useEffect, useCallback } from "react";
import type { TimerState, AppSettings } from "@/core/types";
import {
  getRemainingMs,
  formatRemainingTime,
  getCooldownRemainingMs,
} from "@/core/timer";
import { sendMessage } from "@/utils/messaging";

export default function App() {
  const [state, setState] = useState<TimerState | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [now, setNow] = useState(Date.now());

  const fetchState = useCallback(async () => {
    const res = await sendMessage({ type: "GET_STATE" });
    if (res.success) {
      if (res.state) setState(res.state);
      if (res.settings) setSettings(res.settings);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!state) return;
    if (state.status === "idle") {
      window.location.href = "about:newtab";
    }
  }, [state]);

  const handleRequestCancel = async () => {
    const res = await sendMessage({ type: "REQUEST_CANCEL" });
    if (res.success && res.state) setState(res.state);
  };

  const handleCancelCancelRequest = async () => {
    const res = await sendMessage({ type: "CANCEL_CANCEL_REQUEST" });
    if (res.success && res.state) setState(res.state);
  };

  if (!state || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const remainingMs = getRemainingMs(state, now);
  const remainingTime = formatRemainingTime(remainingMs);

  const isCancelling = state.status === "cancelling";
  const cooldownMs = isCancelling
    ? getCooldownRemainingMs(state, settings.cooldownMinutes, now)
    : 0;
  const cooldownTime = formatRemainingTime(cooldownMs);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md space-y-8 px-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold tracking-tight">作業集中モード</h1>
          <p className="text-slate-400">
            集中して作業に取り組みましょう
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
          <p className="mb-2 text-sm text-slate-400">残り時間</p>
          <p className="font-mono text-5xl font-bold tabular-nums tracking-wider text-white">
            {remainingTime}
          </p>
        </div>

        {isCancelling && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-4">
            <p className="mb-1 text-sm text-amber-400">
              解除リクエスト中
            </p>
            <p className="font-mono text-lg tabular-nums text-amber-300">
              クールダウン残り: {cooldownTime}
            </p>
            <button
              onClick={handleCancelCancelRequest}
              className="mt-3 rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-600"
            >
              解除リクエストを取り消す
            </button>
          </div>
        )}

        {!isCancelling && state.cancelPolicy !== "none" && (
          <button
            onClick={handleRequestCancel}
            className="rounded-lg border border-slate-600 px-6 py-3 text-sm text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-300"
          >
            {state.cancelPolicy === "immediate"
              ? "作業を終了する"
              : "解除をリクエストする"}
          </button>
        )}

        {state.cancelPolicy === "none" && (
          <p className="text-xs text-slate-600">
            タイマー終了まで解除できません
          </p>
        )}
      </div>
    </div>
  );
}
