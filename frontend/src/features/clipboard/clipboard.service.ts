/**
 * Clipboard Protection Service
 * Copies sensitive secrets to clipboard and automatically clears them after timeout
 * only if the clipboard contents still match the copied secret.
 */

let activeTimeoutId: number | null = null;

export async function copyToClipboardWithAutoClear(
  text: string,
  timeoutSeconds = 30,
  onClearCallback?: () => void
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    if (activeTimeoutId !== null) {
      window.clearTimeout(activeTimeoutId);
      activeTimeoutId = null;
    }

    activeTimeoutId = window.setTimeout(async () => {
      try {
        const currentText = await navigator.clipboard.readText();
        if (currentText === text) {
          await navigator.clipboard.writeText('');
          if (onClearCallback) onClearCallback();
        }
      } catch (_) {
        // Handle readText permission denial gracefully
      }
    }, timeoutSeconds * 1000);

    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
