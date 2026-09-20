import { apiClient } from '../../services/api-client';
import { deriveAccountAuthKey, deriveMasterEncryptionKey, generateRandomSalt } from '../../crypto/kdf';
import { useAuthStore } from './auth.store';
import { useCryptoStore } from '../../crypto/key-store';
import type { RegisterPayload, LoginPayload, UserProfile, AuthResponse } from './auth.types';

export const authService = {
  async register({ email, masterPasswordStr }: RegisterPayload): Promise<UserProfile> {
    const authSaltHex = generateRandomSalt(16);
    const vaultSaltHex = generateRandomSalt(16);
    const kdfIterations = 600000;

    const authHash = await deriveAccountAuthKey(masterPasswordStr, authSaltHex, kdfIterations);

    const userProfile = await apiClient.post<UserProfile>('/auth/register', {
      email,
      auth_hash: authHash,
      auth_salt: authSaltHex,
      vault_salt: vaultSaltHex,
      kdf_iterations: kdfIterations,
    });

    const loginRes = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      auth_hash: authHash,
    });

    localStorage.setItem('access_token', loginRes.access_token);

    useAuthStore.getState().setUser(userProfile);
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

    localStorage.setItem('access_token', tokenRes.access_token);

    const userProfile: UserProfile = {
      id: tokenRes.user_id,
      email: tokenRes.email,
      auth_salt: tokenRes.auth_salt,
      vault_salt: tokenRes.vault_salt,
      kdf_iterations: tokenRes.kdf_iterations,
      created_at: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(userProfile);
    useCryptoStore.getState().lockVault();

    return userProfile;
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

  async restoreSession(): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      useAuthStore.getState().logout();
      return false;
    }

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
      await apiClient.post('/auth/logout', {});
    } catch (_) {}
    useAuthStore.getState().logout();
    useCryptoStore.getState().lockVault();
  },
};
