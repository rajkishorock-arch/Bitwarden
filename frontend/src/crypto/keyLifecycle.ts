/**
 * Master Encryption Key Lifecycle Manager
 * Handles vault unlocking (deriving MEK) and vault locking (purging memory references).
 * Guarantees master password strings are not held in long-lived state.
 */

import { deriveMasterEncryptionKey } from './kdf';
import { useCryptoStore } from './key-store';
import { InvalidPasswordError } from './crypto.errors';

export async function unlockVault(
  masterPasswordStr: string,
  vaultSaltHex: string,
  kdfIterations = 600000
): Promise<CryptoKey> {
  const store = useCryptoStore.getState();
  store.setLockState('UNLOCKING');

  try {
    const mek = await deriveMasterEncryptionKey(masterPasswordStr, vaultSaltHex, kdfIterations);
    
    // Store MEK reference in RAM-only store
    store.setMasterEncryptionKey(mek);
    store.setLockState('UNLOCKED');

    return mek;
  } catch (err: any) {
    store.setLockState('LOCKED');
    throw new InvalidPasswordError('Unable to unlock vault. Check your master password.');
  }
}

export function lockVault(): void {
  const store = useCryptoStore.getState();
  store.setLockState('LOCKING');
  store.lockVault();
  store.setLockState('LOCKED');
}
