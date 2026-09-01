"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "../../src/lib/auth-client";
import { Logomark } from "../../src/components/landing/SiteNav";

type Mode = "sign-in" | "sign-up";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Land on the app, not the marketing page, unless the middleware sent us
  // here from somewhere specific.
  const from = searchParams.get("from") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  async function handleGoogle() {
    setError(null);
    // Must be absolute: the OAuth callback is processed server-side on the
    // API's own origin, so a relative "/" would resolve there instead of
    // back to this app.
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${from}`,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "sign-up") {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
          // Same reasoning as handleGoogle: the verification email link is
          // opened outside this page, and better-auth redirects wherever
          // this points after confirming it — must be absolute.
          callbackURL: `${window.location.origin}${from}`,
        });
        if (signUpError) throw new Error(signUpError.message ?? "Sign up failed");
        setCheckInbox(true);
      } else {
        const { error: signInError } = await authClient.signIn.email({ email, password });
        if (signInError) throw new Error(signInError.message ?? "Sign in failed");
        router.push(from);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (checkInbox) {
    return (
      <AuthShell>
        <h1 className="title-serif">Check your inbox</h1>
        <p className="mt-4 text-body text-muted">
          We sent a verification link to <span className="font-medium text-ink">{email}</span>.
          Follow it to finish signing up.
        </p>
        <Link href="/" className="btn-secondary mt-7 self-start">
          Back to the site
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="title-serif">
        {mode === "sign-in" ? "Welcome back" : "Make your first deck"}
      </h1>
      <p className="mt-4 text-body text-muted">
        {mode === "sign-in"
          ? "Sign in to pick up where you left off."
          : "Free to start. One sentence is all the first deck needs."}
      </p>

      <button type="button" onClick={handleGoogle} className="btn-secondary mt-8 w-full py-3">
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="m6.3 14.7 6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.2-17.7 10.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.6 5C9.9 39.6 16.4 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.6 5.4C41.5 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-micro uppercase tracking-[0.12em] text-faint">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        {mode === "sign-up" && (
          <label className="block">
            <span className="eyebrow">Name</span>
            <input
              className="field mt-1.5"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}
        <label className="block">
          <span className="eyebrow">Email</span>
          <input
            className="field mt-1.5"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="eyebrow">Password</span>
          <input
            className="field mt-1.5"
            type="password"
            placeholder={mode === "sign-up" ? "At least 8 characters" : "••••••••"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-[10px] border px-3.5 py-2.5 text-small"
            style={{ borderColor: "#E8CDBB", color: "#C2410C", background: "#FDF4EE" }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary mt-2 w-full py-3">
          {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-small text-muted">
        {mode === "sign-in" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
          className="font-medium text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink"
        >
          {mode === "sign-in" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </AuthShell>
  );
}

/**
 * Two panels: the brand side is the same ink panel the landing page closes on,
 * so arriving here doesn't feel like leaving the product.
 */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-[44%] max-w-[560px] flex-col justify-between p-12 lg:flex"
        style={{ background: "#1F1B16", color: "#FFF8F0" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Logomark size={22} onDark />
          <span className="text-body font-semibold tracking-[-0.01em]">superGamma</span>
        </Link>

        <div>
          <p className="serif text-[2.1rem] leading-[1.15]">
            “Describe the deck.” is the whole interface.
          </p>
          <p className="mt-5 max-w-measure text-body text-on-tone/70">
            Ten designed layouts, eleven chart forms, five themes, and a .pptx you can still edit
            when you get there.
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {["#C2410C", "#CA8A04", "#4D7C0F", "#0F766E", "#9D174D"].map((tone) => (
            <i key={tone} className="h-1.5 w-12 rounded-full" style={{ background: tone }} />
          ))}
        </div>
      </aside>

      <div className="rule-grid flex flex-1 items-center justify-center px-5 py-14 sm:px-8">
        <div className="tile flex w-full max-w-[420px] flex-col p-7 sm:p-9">
          <Link href="/" className="mb-7 flex items-center gap-2.5 lg:hidden">
            <Logomark size={20} />
            <span className="text-small font-semibold">superGamma</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
