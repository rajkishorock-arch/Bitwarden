import { apiClient } from '../../services/api-client';
import { deriveAccountAuthKey, generateRandomSalt } from '../../crypto/kdf';
import { useAuthStore } from './auth.store';
import { useCryptoStore } from '../../crypto/key-store';
import type { RegisterPayload, LoginPayload, UserProfile, AuthResponse } from './auth.types';

export const authService = {
  async register({ email, masterPasswordStr }: RegisterPayload): Promise<UserProfile> {
    const authSaltHex = generateRandomSalt(16);
    const vaultSaltHex = generateRandomSalt(16);
    const kdfIterations = 600000;

    // Derive Account Auth Key for server registration
    const authHash = await deriveAccountAuthKey(masterPasswordStr, authSaltHex, kdfIterations);

    const userProfile = await apiClient.post<UserProfile>('/auth/register', {
      email,
      auth_hash: authHash,
      auth_salt: authSaltHex,
      vault_salt: vaultSaltHex,
      kdf_iterations: kdfIterations,
    });

    // Login session (Backend sets HTTP-Only Cookie)
    await apiClient.post<AuthResponse>('/auth/login', {
      email,
      auth_hash: authHash,
    });

    useAuthStore.getState().setUser(userProfile);
    // Vault remains LOCKED after login (No MEK derived in Phase 2)
    useCryptoStore.getState().lockVault();

    return userProfile;
  },

  async login({ email, masterPasswordStr }: LoginPayload): Promise<UserProfile> {
    const mockSaltHex = generateRandomSalt(16);
    const authHashTemp = await deriveAccountAuthKey(masterPasswordStr, mockSaltHex, 600000);

    const tokenRes = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      auth_hash: authHashTemp,
    }).catch((err) => {
      if (err.status === 401) {
        throw new Error('Invalid email address or master password.');
      }
      throw new Error(err.message || 'Failed to authenticate with server.');
    });

    const userProfile: UserProfile = {
      id: tokenRes.user_id,
      email: tokenRes.email,
      auth_salt: tokenRes.auth_salt,
      vault_salt: tokenRes.vault_salt,
      kdf_iterations: tokenRes.kdf_iterations,
      created_at: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(userProfile);
    // Vault remains LOCKED after login (No MEK derived in Phase 2)
    useCryptoStore.getState().lockVault();

    return userProfile;
  },

  async unlockVault(_masterPasswordStr: string): Promise<boolean> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('No active user account session.');

    // Phase 2 UI State Shell: Confirms user session is active.
    // Actual Web Crypto AES-256-GCM vault decryption engine belongs to Phase 3.
    return true;
  },

  async restoreSession(): Promise<boolean> {
    try {
      const userProfile = await apiClient.get<UserProfile>('/auth/me');
      useAuthStore.getState().setUser(userProfile);
      return true;
    } catch (_) {
      useAuthStore.getState().logout();
      useCryptoStore.getState().lockVault();
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {}
    useAuthStore.getState().logout();
    useCryptoStore.getState().lockVault();
  },
};
