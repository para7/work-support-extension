import {
  createTimerState,
  isTimerActive,
  isTimerExpired,
  resetTimer,
} from "@/core/timer";
import { shouldBlock } from "@/core/whitelist";
import { ALARM_NAME, ALARM_CHECK_NAME } from "@/core/config";
import type { MessageType, MessageResponse } from "@/core/types";
import {
  getTimerState,
  setTimerState,
  getSettings,
  updateSettings,
} from "@/utils/storage";

export default defineBackground(() => {
  const BLOCKED_URL = browser.runtime.getURL("/blocked.html");

  function buildBlockedUrl(originalUrl: string): string {
    return `${BLOCKED_URL}?url=${encodeURIComponent(originalUrl)}`;
  }

  function extractOriginalUrl(blockedTabUrl: string): string | null {
    try {
      const u = new URL(blockedTabUrl);
      return u.searchParams.get("url");
    } catch {
      return null;
    }
  }

  async function blockExistingTabs(): Promise<void> {
    const settings = await getSettings();
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      if (tab.url.startsWith(BLOCKED_URL)) continue;
      if (shouldBlock(tab.url, settings.whitelist)) {
        await browser.tabs.update(tab.id, { url: buildBlockedUrl(tab.url) });
      }
    }
  }

  async function unblockTabs(): Promise<void> {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      if (tab.url.startsWith(BLOCKED_URL)) {
        const originalUrl = extractOriginalUrl(tab.url);
        await browser.tabs.update(tab.id, { url: originalUrl ?? "about:newtab" });
      }
    }
  }

  async function startTimer(durationMinutes: number): Promise<void> {
    const state = createTimerState(durationMinutes);
    await setTimerState(state);

    const delayMinutes = Math.max(durationMinutes, 0.5);
    await browser.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });
    await browser.alarms.create(ALARM_CHECK_NAME, { periodInMinutes: 1 });

    await blockExistingTabs();
  }

  async function stopTimer(): Promise<void> {
    await setTimerState(resetTimer());
    await browser.alarms.clear(ALARM_NAME);
    await browser.alarms.clear(ALARM_CHECK_NAME);
    await unblockTabs();
  }

  async function checkTimerExpiry(): Promise<void> {
    const state = await getTimerState();
    if (!isTimerActive(state)) return;

    if (isTimerExpired(state)) {
      await stopTimer();
    }
  }

  // --- Navigation blocking ---
  browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return;

    const state = await getTimerState();
    if (!isTimerActive(state)) return;

    const settings = await getSettings();
    if (!shouldBlock(details.url, settings.whitelist)) return;
    if (details.url.startsWith(BLOCKED_URL)) return;

    await browser.tabs.update(details.tabId, { url: buildBlockedUrl(details.url) });
  });

  // --- Tab update blocking (catches address bar direct input) ---
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!changeInfo.url) return;

    const state = await getTimerState();
    if (!isTimerActive(state)) return;

    const settings = await getSettings();
    if (!shouldBlock(changeInfo.url, settings.whitelist)) return;
    if (changeInfo.url.startsWith(BLOCKED_URL)) return;

    await browser.tabs.update(tabId, { url: buildBlockedUrl(changeInfo.url) });
  });

  // --- Alarm handler ---
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME || alarm.name === ALARM_CHECK_NAME) {
      await checkTimerExpiry();
    }
  });

  // --- Message handler ---
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      const msg = message as MessageType;
      const handle = async (): Promise<MessageResponse> => {
        switch (msg.type) {
          case "START_TIMER": {
            await startTimer(msg.duration);
            const state = await getTimerState();
            return { success: true, state };
          }
          case "GET_STATE": {
            const state = await getTimerState();
            const settings = await getSettings();
            return { success: true, state, settings };
          }
          case "UPDATE_SETTINGS": {
            const settings = await updateSettings(msg.settings);
            return { success: true, settings };
          }
          default:
            return { success: false, error: "Unknown message type" };
        }
      };
      handle().then(sendResponse);
      return true;
    },
  );

  checkTimerExpiry();
});
