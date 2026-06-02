import { useState, useEffect, useCallback } from "react";
import type { TimerState, AppSettings, CancelPolicy } from "@/core/types";
import { getRemainingMs, formatRemainingTime } from "@/core/timer";
import { DURATION_PRESETS } from "@/core/config";
import { sendMessage } from "@/utils/messaging";
import {
  addToWhitelist,
  removeFromWhitelist,
} from "@/core/whitelist";

type View = "main" | "settings";

export default function App() {
  const [state, setState] = useState<TimerState | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [view, setView] = useState<View>("main");
  const [newDomain, setNewDomain] = useState("");
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

  const handleStart = async (minutes: number) => {
    if (minutes <= 0) return;
    const res = await sendMessage({ type: "START_TIMER", duration: minutes });
    if (res.success && res.state) setState(res.state);
  };

  const handleStop = async () => {
    const res = await sendMessage({ type: "STOP_TIMER" });
    if (res.success && res.state) setState(res.state);
  };

  const handleRequestCancel = async () => {
    const res = await sendMessage({ type: "REQUEST_CANCEL" });
    if (res.success && res.state) setState(res.state);
  };

  const handleUpdateCancelPolicy = async (policy: CancelPolicy) => {
    const res = await sendMessage({
      type: "UPDATE_SETTINGS",
      settings: { cancelPolicy: policy },
    });
    if (res.success && res.settings) setSettings(res.settings);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim() || !settings) return;
    const updated = addToWhitelist(settings.whitelist, newDomain);
    const res = await sendMessage({
      type: "UPDATE_SETTINGS",
      settings: { whitelist: updated },
    });
    if (res.success && res.settings) setSettings(res.settings);
    setNewDomain("");
  };

  const handleRemoveDomain = async (pattern: string) => {
    if (!settings) return;
    const updated = removeFromWhitelist(settings.whitelist, pattern);
    const res = await sendMessage({
      type: "UPDATE_SETTINGS",
      settings: { whitelist: updated },
    });
    if (res.success && res.settings) setSettings(res.settings);
  };

  if (!state || !settings) {
    return (
      <div className="flex h-40 items-center justify-center bg-slate-900">
        <p className="text-sm text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const isRunning = state.status === "running" || state.status === "cancelling";

  if (view === "settings") {
    return (
      <SettingsView
        settings={settings}
        newDomain={newDomain}
        onNewDomainChange={setNewDomain}
        onAddDomain={handleAddDomain}
        onRemoveDomain={handleRemoveDomain}
        onUpdateCancelPolicy={handleUpdateCancelPolicy}
        onBack={() => setView("main")}
      />
    );
  }

  if (isRunning) {
    const remainingMs = getRemainingMs(state, now);
    const remainingTime = formatRemainingTime(remainingMs);

    return (
      <div className="bg-slate-900 p-5 text-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-semibold">作業集中モード</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            実行中
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5 text-center">
          <p className="mb-1 text-xs text-slate-400">残り時間</p>
          <p className="font-mono text-3xl font-bold tabular-nums tracking-wider">
            {remainingTime}
          </p>
        </div>

        {state.cancelPolicy !== "none" && (
          <button
            onClick={
              state.cancelPolicy === "immediate" ? handleStop : handleRequestCancel
            }
            className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-400 transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            {state.cancelPolicy === "immediate"
              ? "作業を終了する"
              : "解除をリクエストする"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-5 text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-sm font-semibold">作業集中ブロッカー</h1>
        <button
          onClick={() => setView("settings")}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          title="設定"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      <div className="mb-3">
        <p className="mb-2 text-xs text-slate-400">プリセット</p>
        <div className="grid grid-cols-3 gap-2">
          {DURATION_PRESETS.map((mins) => (
            <button
              key={mins}
              onClick={() => handleStart(mins)}
              className="rounded-lg bg-slate-800 py-2.5 text-sm font-medium transition-colors hover:bg-indigo-600"
            >
              {mins}分
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-slate-400">カスタム</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="480"
            value={customDuration}
            onChange={(e) => setCustomDuration(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStart(Number(customDuration));
            }}
            placeholder="分数を入力"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleStart(Number(customDuration))}
            disabled={!customDuration || Number(customDuration) <= 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            開始
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsView({
  settings,
  newDomain,
  onNewDomainChange,
  onAddDomain,
  onRemoveDomain,
  onUpdateCancelPolicy,
  onBack,
}: {
  settings: AppSettings;
  newDomain: string;
  onNewDomainChange: (v: string) => void;
  onAddDomain: () => void;
  onRemoveDomain: (pattern: string) => void;
  onUpdateCancelPolicy: (policy: CancelPolicy) => void;
  onBack: () => void;
}) {
  const policies: { value: CancelPolicy; label: string; desc: string }[] = [
    { value: "none", label: "解除不可", desc: "タイマー終了まで解除できません" },
    {
      value: "cooldown",
      label: "クールダウン",
      desc: "解除リクエスト後、5分待つと解除",
    },
    { value: "immediate", label: "即解除", desc: "確認後すぐに解除できます" },
  ];

  return (
    <div className="bg-slate-900 p-5 text-slate-100">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold">設定</h1>
      </div>

      <div className="mb-5">
        <h2 className="mb-2 text-xs font-medium text-slate-400">解除ポリシー</h2>
        <div className="space-y-1.5">
          {policies.map((p) => (
            <label
              key={p.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                settings.cancelPolicy === p.value
                  ? "border-indigo-500 bg-indigo-950/30"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <input
                type="radio"
                name="cancelPolicy"
                value={p.value}
                checked={settings.cancelPolicy === p.value}
                onChange={() => onUpdateCancelPolicy(p.value)}
                className="mt-0.5 accent-indigo-500"
              />
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-medium text-slate-400">ホワイトリスト</h2>
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => onNewDomainChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAddDomain();
            }}
            placeholder="例: github.com"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            onClick={onAddDomain}
            disabled={!newDomain.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            追加
          </button>
        </div>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {settings.whitelist.map((entry) => (
            <div
              key={entry.pattern}
              className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
            >
              <span className="text-sm">{entry.pattern}</span>
              <button
                onClick={() => onRemoveDomain(entry.pattern)}
                className="text-slate-500 transition-colors hover:text-red-400"
                title="削除"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
