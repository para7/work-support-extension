export type CancelPolicy = "none" | "cooldown" | "immediate";

export interface TimerState {
  status: "idle" | "running" | "cancelling";
  endTime: number | null;
  duration: number | null;
  cancelPolicy: CancelPolicy;
  cancelRequestedAt: number | null;
}

export interface WhitelistEntry {
  pattern: string;
}

export interface AppSettings {
  cancelPolicy: CancelPolicy;
  cooldownMinutes: number;
  whitelist: WhitelistEntry[];
}

export type MessageType =
  | { type: "START_TIMER"; duration: number }
  | { type: "STOP_TIMER" }
  | { type: "REQUEST_CANCEL" }
  | { type: "CANCEL_CANCEL_REQUEST" }
  | { type: "GET_STATE" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> };

export type MessageResponse =
  | { success: true; state?: TimerState; settings?: AppSettings }
  | { success: false; error: string };
