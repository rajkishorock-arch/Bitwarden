/**
 * Clipboard Protection Service
 * Copies sensitive secrets to clipboard and automatically clears them after timeout (default 30s)
 * ONLY if the clipboard contents still match the secret that was copied.
 */

let activeTimeoutId: number | null = null;

export function cancelClipboardClearTimer(): void {
  if (activeTimeoutId !== null) {
    window.clearTimeout(activeTimeoutId);
    activeTimeoutId = null;
  }
}

export async function copyToClipboardWithAutoClear(
  text: string,
  timeoutSeconds = 30,
  onClearCallback?: () => void
): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return false;
    }

    await navigator.clipboard.writeText(text);
    cancelClipboardClearTimer();

    if (timeoutSeconds > 0) {
      activeTimeoutId = window.setTimeout(async () => {
        try {
          const currentText = await navigator.clipboard.readText();
          if (currentText === text) {
            await navigator.clipboard.writeText('');
            if (onClearCallback) onClearCallback();
          }
        } catch (_) {
          // Gracefully ignore readText permission denials
        } finally {
          activeTimeoutId = null;
        }
      }, timeoutSeconds * 1000);
    }

    return true;
  } catch (_) {
    return false;
  }
}
