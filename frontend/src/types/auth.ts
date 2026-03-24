export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  imageUrl: string | null;
  provider: string;
  providerUserId: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}
