import { apiClient } from '../../services/api-client';
import { deriveAccountAuthKey, generateRandomSalt } from '../../crypto/kdf';
import { unlockVault as cryptoUnlockVault, lockVault as cryptoLockVault } from '../../crypto/keyLifecycle';
import { useAuthStore } from './auth.store';
import { useVaultStore } from '../vault/vault.store';
import type { RegisterPayload, LoginPayload, UserProfile, AuthResponse } from './auth.types';

interface PreloginResponse {
  auth_salt: string;
  kdf_iterations: number;
}

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

    // Automatically derive MEK and unlock vault upon registration
    const mek = await cryptoUnlockVault(masterPasswordStr, userProfile.vault_salt, userProfile.kdf_iterations);
    await useVaultStore.getState().fetchItems(mek);

    return userProfile;
  },

  async login({ email, masterPasswordStr }: LoginPayload): Promise<UserProfile> {
    // 1. Fetch user's auth_salt via prelogin
    const preloginRes = await apiClient.post<PreloginResponse>('/auth/prelogin', { email });

    // 2. Derive Account Auth Key using user's actual auth_salt
    const authHash = await deriveAccountAuthKey(
      masterPasswordStr,
      preloginRes.auth_salt,
      preloginRes.kdf_iterations || 600000
    );

    // 3. Authenticate with server
    const tokenRes = await apiClient
      .post<AuthResponse>('/auth/login', {
        email,
        auth_hash: authHash,
      })
      .catch((err) => {
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

    // 4. Derive MEK and unlock vault in memory
    const mek = await cryptoUnlockVault(masterPasswordStr, userProfile.vault_salt, userProfile.kdf_iterations);
    await useVaultStore.getState().fetchItems(mek);

    return userProfile;
  },

  async unlockVault(masterPasswordStr: string): Promise<boolean> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('No active user account session.');

    const mek = await cryptoUnlockVault(masterPasswordStr, user.vault_salt, user.kdf_iterations);
    await useVaultStore.getState().fetchItems(mek);
    return true;
  },

  async restoreSession(): Promise<boolean> {
    try {
      const userProfile = await apiClient.get<UserProfile>('/auth/me');
      useAuthStore.getState().setUser(userProfile);
      return true;
    } catch (_) {
      useAuthStore.getState().logout();
      cryptoLockVault();
      useVaultStore.getState().clearVaultState();
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {}

    cryptoLockVault();
    useVaultStore.getState().clearVaultState();
    useAuthStore.getState().logout();
  },
};
