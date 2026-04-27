import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env, isGoogleOAuthConfigured } from "./env.js";
import { upsertGoogleUser } from "../services/auth.service.js";

export function configurePassport() {
  if (!isGoogleOAuthConfigured()) return;

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email from Google"));
          }
          const user = await upsertGoogleUser({
            googleId: profile.id,
            email: email.toLowerCase(),
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
          });
          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    )
  );
}
