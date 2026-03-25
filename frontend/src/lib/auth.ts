import jwt from "jsonwebtoken";

export interface AppUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  imageUrl: string | null;
  provider: string;
  providerUserId: string;
}

export function mergeAuthUser(baseUser: AppUser, updates: Partial<AppUser>): AppUser {
  return {
    ...baseUser,
    ...updates,
    imageUrl: updates.imageUrl ?? baseUser.imageUrl,
  };
}

export interface SessionPayload {
  user: AppUser;
  expiresAt: number;
}

const SESSION_COOKIE = "todo_ai_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function signSession(payload: Omit<SessionPayload, "expiresAt">): string {
  const secret = requireEnv("AUTH_SECRET");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return jwt.sign({ ...payload, expiresAt }, secret, { algorithm: "HS256" });
}

export function verifySession(token?: string | null): SessionPayload | null {
  if (!token) return null;

  try {
    const secret = requireEnv("AUTH_SECRET");
    const decoded = jwt.verify(token, secret) as SessionPayload;
    if (decoded.expiresAt <= Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function mintAccessToken(user: AppUser): string {
  const secret = requireEnv("APP_JWT_SECRET");
  const issuer = process.env.APP_JWT_ISSUER || "todo-ai-auth";
  const audience = process.env.APP_JWT_AUDIENCE;
  const subject = user.providerUserId;
  const signOptions: jwt.SignOptions = {
    algorithm: "HS256",
    issuer,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };

  if (audience) {
    signOptions.audience = audience;
  }

  return jwt.sign(
    {
      sub: subject,
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      name: user.name,
      provider: user.provider,
      provider_user_id: user.providerUserId,
    },
    secret,
    signOptions
  );
}

export function getAccessTokenTtlSeconds(): number {
  return ACCESS_TOKEN_TTL_SECONDS;
}

export function buildUserFromProfile(params: {
  provider: string;
  providerUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  imageUrl?: string | null;
}): AppUser {
  const email = params.email ?? null;
  const fallbackName = [params.firstName, params.lastName].filter(Boolean).join(" ") || email || null;

  return {
    id: `${params.provider}:${params.providerUserId}`,
    email,
    firstName: params.firstName ?? null,
    lastName: params.lastName ?? null,
    name: params.name ?? fallbackName,
    imageUrl: params.imageUrl ?? null,
    provider: params.provider,
    providerUserId: params.providerUserId,
  };
}
