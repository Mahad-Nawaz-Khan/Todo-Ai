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

export interface BackendAuthUser {
  id: number;
  auth_subject: string;
  provider: string;
  email: string | null;
  first_name: string;
  last_name: string;
  name: string | null;
  profile_image_url: string | null;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}
