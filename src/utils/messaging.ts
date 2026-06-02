import type { MessageType, MessageResponse } from "@/core/types";

export async function sendMessage(message: MessageType): Promise<MessageResponse> {
  return browser.runtime.sendMessage(message);
}

export function onMessage(
  handler: (
    message: MessageType,
    sender: browser.runtime.MessageSender,
  ) => Promise<MessageResponse> | MessageResponse,
): void {
  browser.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      const result = handler(message as MessageType, sender);
      if (result instanceof Promise) {
        result.then(sendResponse);
        return true;
      }
      sendResponse(result);
      return false;
    },
  );
}
