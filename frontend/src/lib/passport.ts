import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";

import { AppUser, buildUserFromProfile } from "./auth";

type OAuthUser = AppUser;

declare global {
  var __todoPassportConfigured: boolean | undefined;
}

function configurePassport() {
  if (global.__todoPassportConfigured) {
    return passport;
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `${appUrl}/api/auth/callback/google`,
          scope: ["profile", "email"],
        },
        (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: (error: unknown, user?: OAuthUser) => void) => {
          const email = profile.emails?.find((item) => item.verified)?.value ?? profile.emails?.[0]?.value ?? null;
          const user = buildUserFromProfile({
            provider: "google",
            providerUserId: profile.id,
            email,
            firstName: profile.name?.givenName ?? null,
            lastName: profile.name?.familyName ?? null,
            name: profile.displayName ?? null,
            imageUrl: profile.photos?.[0]?.value ?? null,
          });
          done(null, user as OAuthUser);
        }
      )
    );
  }

  if (githubClientId && githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubClientId,
          clientSecret: githubClientSecret,
          callbackURL: `${appUrl}/api/auth/callback/github`,
          scope: ["user:email"],
        },
        (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: (error: unknown, user?: OAuthUser) => void) => {
          const primaryEmail = profile.emails?.[0]?.value ?? null;
          const [firstName, ...rest] = (profile.displayName || "").split(" ").filter(Boolean);
          const lastName = rest.length ? rest.join(" ") : null;
          const user = buildUserFromProfile({
            provider: "github",
            providerUserId: profile.id,
            email: primaryEmail,
            firstName: firstName || null,
            lastName,
            name: profile.displayName ?? profile.username ?? null,
            imageUrl: profile.photos?.[0]?.value ?? null,
          });
          done(null, user as OAuthUser);
        }
      )
    );
  }

  global.__todoPassportConfigured = true;
  return passport;
}

export const configuredPassport = configurePassport();
