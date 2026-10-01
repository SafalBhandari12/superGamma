/**
 * Creates an already-verified email/password user for local testing, skipping
 * the verification email. Usage:
 *   pnpm tsx scripts/createTestUser.ts [email] [password] [name]
 */
import { auth } from "../src/auth.js";
import { pool } from "../src/db/client.js";

const [email = "test@supergamma.dev", password = "TestPass123!", name = "Test User"] =
  process.argv.slice(2);

const ctx = await auth.$context;

const existing = await ctx.internalAdapter.findUserByEmail(email);
if (existing) {
  console.log(`User ${email} already exists — nothing to do.`);
} else {
  const user = await ctx.internalAdapter.createUser({ email, name, emailVerified: true });
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    // = createLocalAccountIssuer("credential") from @better-auth/core/db (not a
    // direct dep here). Sign-in in 1.7.x ignores credential accounts without it.
    issuer: "local:credential",
    password: await ctx.password.hash(password),
  });
  console.log(`Created ${email} / ${password}`);
}

await pool.end();
