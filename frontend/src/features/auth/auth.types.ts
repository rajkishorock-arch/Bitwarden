export interface RegisterPayload {
  email: string;
  masterPasswordStr: string;
}

export interface LoginPayload {
  email: string;
  masterPasswordStr: string;
}

export interface UserProfile {
  id: string;
  email: string;
  auth_salt: string;
  vault_salt: string;
  kdf_iterations: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  auth_salt: string;
  vault_salt: string;
  kdf_iterations: number;
}
