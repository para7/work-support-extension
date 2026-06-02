import { useState, useEffect, useCallback } from "react";
import type { TimerState, AppSettings } from "@/core/types";
import { getRemainingMs, formatRemainingTime } from "@/core/timer";
import { addToWhitelist } from "@/core/whitelist";
import { sendMessage } from "@/utils/messaging";

export default function App() {
  const [state, setState] = useState<TimerState | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [now, setNow] = useState(Date.now());
  const [added, setAdded] = useState(false);

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

  const originalUrl = new URLSearchParams(window.location.search).get("url");
  const blockedDomain = originalUrl ? (() => {
    try { return new URL(originalUrl).hostname; } catch { return null; }
  })() : null;

  useEffect(() => {
    if (!state) return;
    if (state.status === "idle") {
      window.location.href = originalUrl ?? "about:newtab";
    }
  }, [state, originalUrl]);

  const handleAddToWhitelist = async () => {
    if (!blockedDomain || !settings) return;
    const updated = addToWhitelist(settings.whitelist, blockedDomain);
    const res = await sendMessage({
      type: "UPDATE_SETTINGS",
      settings: { whitelist: updated },
    });
    if (res.success) {
      setAdded(true);
      if (originalUrl) {
        window.location.href = originalUrl;
      }
    }
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md space-y-8 px-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold tracking-tight">作業集中モード</h1>
          <p className="text-slate-400">
            集中して作業に取り組みましょう
          </p>
          {originalUrl && (
            <p className="truncate text-xs text-slate-500" title={originalUrl}>
              {originalUrl}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
          <p className="mb-2 text-sm text-slate-400">残り時間</p>
          <p className="font-mono text-5xl font-bold tabular-nums tracking-wider text-white">
            {remainingTime}
          </p>
        </div>
        <p className="text-xs text-slate-600">
          タイマー終了まで解除できません
        </p>
      </div>
    </div>
  );
}
