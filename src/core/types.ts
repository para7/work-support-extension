export interface TimerState {
  status: "idle" | "running";
  endTime: number | null;
  duration: number | null;
}

export interface WhitelistEntry {
  pattern: string;
}

export interface AppSettings {
  whitelist: WhitelistEntry[];
}

export type MessageType =
  | { type: "START_TIMER"; duration: number }
  | { type: "GET_STATE" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> };

export type MessageResponse =
  | { success: true; state?: TimerState; settings?: AppSettings }
  | { success: false; error: string };
