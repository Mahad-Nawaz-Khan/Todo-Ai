"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { mergeAuthUser } from "@/lib/auth";
import type { AuthSessionResponse, AuthUser, BackendAuthUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchSession(): Promise<AuthSessionResponse> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load session");
  }

  return response.json();
}

async function fetchToken(): Promise<string | null> {
  const response = await fetch("/api/auth/token", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to get access token");
  }

  const data = await response.json();
  return data.accessToken ?? null;
}

async function fetchBackendUser(token: string): Promise<BackendAuthUser | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load account profile");
  }

  return response.json();
}

function mergeSessionWithBackendUser(sessionUser: AuthUser, backendUser: BackendAuthUser | null): AuthUser {
  if (!backendUser) {
    return sessionUser;
  }

  return mergeAuthUser(sessionUser, {
    email: backendUser.email ?? sessionUser.email,
    firstName: backendUser.first_name || sessionUser.firstName,
    lastName: backendUser.last_name || sessionUser.lastName,
    name: backendUser.name ?? sessionUser.name,
    imageUrl: backendUser.profile_image_url ?? sessionUser.imageUrl,
    provider: backendUser.provider || sessionUser.provider,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getToken = useCallback(async (): Promise<string | null> => {
    const token = await fetchToken();
    if (!token) {
      setUser(null);
    }
    return token;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await fetchSession();

      if (!session.authenticated || !session.user) {
        setUser(null);
        return;
      }

      const token = await fetchToken();
      if (!token) {
        setUser(null);
        return;
      }

      const backendUser = await fetchBackendUser(token);
      setUser(mergeSessionWithBackendUser(session.user, backendUser));
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setUser(null);
    window.location.href = "/";
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      isSignedIn: Boolean(user),
      getToken,
      refreshSession,
      signOut,
    }),
    [getToken, isLoaded, refreshSession, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
}
