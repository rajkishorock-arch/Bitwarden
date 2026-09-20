import { apiClient } from '../../services/api-client';
import { deriveAccountAuthKey, deriveMasterEncryptionKey, generateRandomSalt } from '../../crypto/kdf';
import { useCryptoStore } from '../../crypto/key-store';
import { useAuthStore } from './auth.store';
import type { User } from '../../types';

export interface RegisterPayload {
  email: string;
  masterPasswordStr: string;
}

export interface LoginPayload {
  email: string;
  masterPasswordStr: string;
}

export const authService = {
  async register({ email, masterPasswordStr }: RegisterPayload): Promise<User> {
    const authSaltHex = generateRandomSalt(16);
    const vaultSaltHex = generateRandomSalt(16);
    const kdfIterations = 600000;

    const authHash = await deriveAccountAuthKey(masterPasswordStr, authSaltHex, kdfIterations);
    const mek = await deriveMasterEncryptionKey(masterPasswordStr, vaultSaltHex, kdfIterations);

    const user = await apiClient.post<User>('/auth/register', {
      email,
      auth_hash: authHash,
      auth_salt: authSaltHex,
      vault_salt: vaultSaltHex,
      kdf_iterations: kdfIterations,
    });

    const loginRes = await apiClient.post<{ access_token: string }>('/auth/login', {
      email,
      auth_hash: authHash,
    });

    localStorage.setItem('access_token', loginRes.access_token);
    useAuthStore.getState().setUser(user);
    useCryptoStore.getState().setMasterEncryptionKey(mek);

    return user;
  },

  async login({ email, masterPasswordStr }: LoginPayload): Promise<User> {
    const mockSaltHex = generateRandomSalt(16);
    const authHashTemp = await deriveAccountAuthKey(masterPasswordStr, mockSaltHex, 600000);

    const tokenRes = await apiClient.post<{
      access_token: string;
      user_id: string;
      email: string;
      auth_salt: string;
      vault_salt: string;
      kdf_iterations: number;
    }>('/auth/login', {
      email,
      auth_hash: authHashTemp,
    }).catch(async (err) => {
      if (err.status === 401) {
        throw new Error('Invalid email or master password.');
      }
      throw err;
    });

    localStorage.setItem('access_token', tokenRes.access_token);

    const user: User = {
      id: tokenRes.user_id,
      email: tokenRes.email,
      auth_salt: tokenRes.auth_salt,
      vault_salt: tokenRes.vault_salt,
      kdf_iterations: tokenRes.kdf_iterations,
      created_at: new Date().toISOString(),
    };

    const mek = await deriveMasterEncryptionKey(
      masterPasswordStr,
      tokenRes.vault_salt,
      tokenRes.kdf_iterations
    );

    useAuthStore.getState().setUser(user);
    useCryptoStore.getState().setMasterEncryptionKey(mek);

    return user;
  },

  async unlockVault(masterPasswordStr: string): Promise<boolean> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('No active user account session.');

    const mek = await deriveMasterEncryptionKey(
      masterPasswordStr,
      user.vault_salt,
      user.kdf_iterations
    );

    useCryptoStore.getState().setMasterEncryptionKey(mek);
    return true;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (_) {}
    useAuthStore.getState().logout();
    useCryptoStore.getState().lockVault();
  },
};
