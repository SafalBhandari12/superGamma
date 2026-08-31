import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config } from "./config.js";
import { db } from "./db/client.js";
import * as schema from "./db/schema.js";
import { sendEmail } from "./lib/mailer.js";

export const auth = betterAuth({
  baseURL: config.apiBaseUrl,
  secret: config.authSecret,
  trustedOrigins: [config.webOrigin],
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your superGamma password",
        html: `<p>Someone asked to reset the password on this account.</p><p><a href="${url}">Reset password</a></p><p>If this wasn't you, you can ignore this email.</p>`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email for superGamma",
        html: `<p>Confirm this address to finish signing up.</p><p><a href="${url}">Verify email</a></p>`,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    },
  },

  /** On top of this, generation-heavy routes get their own express-rate-limit — see middleware/rateLimit.ts. */
  rateLimit: {
    window: 60,
    max: 100,
  },
});
