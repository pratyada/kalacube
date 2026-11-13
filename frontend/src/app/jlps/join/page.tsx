"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fredoka } from "next/font/google";
import { signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { JLPS_SIGNUP_OPEN, rememberCommunity } from "@/lib/community";
import "../jlps.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const GRADES = ["JK", "SK", "1", "2", "3", "4", "5", "6", "7", "8"];
const GOOGLE_ON = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true";

type Step = "loading" | "signin" | "confirm" | "profile" | "other-account";

function errMsg(err: unknown, fallback: string) {
  const r = (err as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  if (r) return Array.isArray(r) ? r.join(", ") : r;
  return (err as Error)?.message || fallback;
}

function makeUsername(first: string, initial: string) {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `jlps-${clean(first).slice(0, 14) || "maker"}-${clean(initial).slice(0, 1) || "x"}-${rand}`;
}

export default function JlpsJoinPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    fetchUser,
    loginWithEmail,
    loginWithGoogle,
    logout,
  } = useAuthStore();

  const [step, setStep] = useState<Step>("loading");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [kid, setKid] = useState({
    first: "",
    initial: "",
    grade: "",
    makes: "",
  });
  const [consent, setConsent] = useState(false);

  // Tag this tab's session as JLPS so the Google round-trip lands back here.
  useEffect(() => {
    rememberCommunity("jlps");
    fetchUser();
  }, [fetchUser]);

  // Route by auth state.
  useEffect(() => {
    if (isLoading || step === "confirm") return;
    if (!isAuthenticated || !user) {
      setStep("signin");
      return;
    }
    if (user.isNewUser) {
      setStep("profile");
      return;
    }
    if (user.community === "jlps") {
      router.replace("/dashboard");
      return;
    }
    setStep("other-account");
  }, [isLoading, isAuthenticated, user, router, step]);

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(errMsg(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () =>
    run(async () => {
      rememberCommunity("jlps");
      await loginWithGoogle();
    }, "Could not start Google sign-in. Please try again.");

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (mode === "new") {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } },
        });
        setStep("confirm");
        setInfo(`We emailed a 6-digit code to ${email}.`);
        return;
      }
      try {
        await loginWithEmail(email, password);
      } catch (err) {
        if ((err as Error)?.message === "ADDITIONAL_STEP:CONFIRM_SIGN_UP") {
          await resendSignUpCode({ username: email });
          setStep("confirm");
          setInfo(
            `Please confirm your email first. We sent a new code to ${email}.`,
          );
          return;
        }
        throw err;
      }
    }, "Something went wrong. Please try again.");
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await confirmSignUp({ username: email, confirmationCode: code.trim() });
      await loginWithEmail(email, password);
      setStep("loading"); // the auth effect moves us to the profile step
    }, "That code didn’t work. Please check it and try again.");
  };

  const handleProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please tick the parent/guardian consent box to continue.");
      return;
    }
    run(async () => {
      const first = kid.first.trim();
      const initial = kid.initial.trim().charAt(0).toUpperCase();
      const body = {
        role: "artist",
        community: "jlps",
        firstName: first,
        lastName: `${initial}.`,
        grade: kid.grade,
        makes: kid.makes.trim() || undefined,
        parentConsent: true,
      };
      // Usernames are auto-generated; retry once on the rare collision.
      try {
        await api.post("/api/auth/onboarding", {
          ...body,
          username: makeUsername(first, initial),
        });
      } catch (err) {
        if (
          (err as { response?: { status?: number } })?.response?.status !== 409
        )
          throw err;
        await api.post("/api/auth/onboarding", {
          ...body,
          username: makeUsername(first, initial),
        });
      }
      await fetchUser();
      router.push("/dashboard/upload");
    }, "Could not create the shop. Please try again.");
  };

  const field =
    "w-full rounded-2xl border-[3px] border-[var(--ink)] bg-white px-4 py-3 text-lg outline-none focus:ring-4 focus:ring-[var(--sun)]";

  // Sign-up needs the new backend; until it's live, collect interest by email.
  if (!JLPS_SIGNUP_OPEN) {
    return (
      <main
        data-jlps
        className={`jlps ${fredoka.variable} flex min-h-screen items-center justify-center px-4`}
      >
        <div className="jlps-card max-w-md p-8 text-center">
          <p className="text-5xl">❄️</p>
          <h1 className="mt-3 text-3xl font-bold">Parent sign-up opens soon!</h1>
          <p className="mt-2 text-lg text-[#3b4a6b]">
            We&apos;re putting the finishing touches on the JLPS Winter Craft Market. Tell us your
            child wants to sell and we&apos;ll email you the moment sign-up opens.
          </p>
          <a
            href="mailto:contact@kalacube.com?subject=JLPS%20Winter%20Craft%20Market%3A%20my%20child%20wants%20to%20sell"
            className="jlps-btn jlps-btn-sun mt-6"
          >
            🖍️ Count us in!
          </a>
          <p className="mt-4">
            <Link href="/jlps" className="font-semibold underline">
              ← Back to the market
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main data-jlps className={`jlps ${fredoka.variable} min-h-screen`}>
      <section className="jlps-hero pb-16">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/jlps" className="text-lg font-bold text-white">
            ❄️ JLPS Winter Craft Market
          </Link>
          <Link
            href="/jlps"
            className="text-sm font-semibold text-white/80 hover:text-white"
          >
            ← Back
          </Link>
        </div>
        <div className="mx-auto max-w-2xl px-4 pt-6 text-center text-white sm:px-6">
          <h1 className="jlps-title text-4xl sm:text-5xl">
            Open your child&apos;s{" "}
            <span className="text-[var(--sun)]">shop</span> 🎨
          </h1>
          <p className="mt-3 text-lg text-white/85">
            For Jean Lumb Public School families. Takes about 2 minutes.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-xl px-4 pb-20 sm:px-6">
        <div className="jlps-card p-6 sm:p-8">
          {error && (
            <div className="mb-5 rounded-2xl border-2 border-[var(--berry)] bg-[#ffe3f0] p-3 text-base">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-5 rounded-2xl border-2 border-[var(--mint)] bg-[#dff7ec] p-3 text-base">
              {info}
            </div>
          )}

          {step === "loading" && (
            <p className="py-10 text-center text-lg">Just a sec… ❄️</p>
          )}

          {step === "signin" && (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
                Step 1 of 2 · Parent sign-in
              </p>
              <h2 className="mt-1 text-3xl font-bold">Hi, JLPS parent! 👋</h2>
              <p className="mt-2 text-[#3b4a6b]">
                The shop is run by you (a parent or guardian). Your email stays
                private, and buyers never see it.
              </p>

              {GOOGLE_ON && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="jlps-btn jlps-btn-white mt-6 w-full"
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                      <path
                        fill="#FFC107"
                        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.4 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                  <div className="my-6 flex items-center gap-3 text-sm text-[#3b4a6b]">
                    <span className="h-[2px] flex-1 bg-[var(--ink)]/15" /> or
                    use email
                    <span className="h-[2px] flex-1 bg-[var(--ink)]/15" />
                  </div>
                </>
              )}

              <div className="mb-4 flex rounded-full border-[3px] border-[var(--ink)] p-1 text-base font-semibold">
                {(["new", "existing"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-full px-3 py-2 ${mode === m ? "bg-[var(--sun)]" : ""}`}
                  >
                    {m === "new" ? "New here" : "I have an account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEmail} className="space-y-4">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Parent email"
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "new" ? "new-password" : "current-password"
                  }
                  placeholder={
                    mode === "new"
                      ? "Create a password (8+ characters)"
                      : "Password"
                  }
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="jlps-btn jlps-btn-sun w-full"
                >
                  {busy
                    ? "One moment…"
                    : mode === "new"
                      ? "Create parent account"
                      : "Sign in"}
                </button>
                {mode === "existing" && (
                  <p className="text-center text-sm">
                    <Link href="/auth/forgot-password" className="underline">
                      Forgot password?
                    </Link>
                  </p>
                )}
              </form>
            </>
          )}

          {step === "confirm" && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <h2 className="text-3xl font-bold">Check your email 📬</h2>
              <p className="text-[#3b4a6b]">
                Enter the 6-digit code we sent you.
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                placeholder="123456"
                className={`${field} text-center text-2xl tracking-[0.4em]`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy}
                className="jlps-btn jlps-btn-sun w-full"
              >
                {busy ? "Checking…" : "Confirm"}
              </button>
              <button
                type="button"
                className="w-full text-sm underline"
                onClick={() =>
                  run(async () => {
                    await resendSignUpCode({ username: email });
                    setInfo("New code sent!");
                  }, "Could not resend the code.")
                }
              >
                Send a new code
              </button>
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={handleProfile} className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
                Step 2 of 2 · About your young maker
              </p>
              <h2 className="text-3xl font-bold">Who&apos;s the maker? 🌟</h2>
              <p className="text-[#3b4a6b]">
                Shoppers only see a first name, last initial and grade, like{" "}
                <b>&ldquo;Maya R., Grade 4&rdquo;</b>.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <input
                  required
                  maxLength={30}
                  placeholder="Child's first name"
                  className={`${field} col-span-2`}
                  value={kid.first}
                  onChange={(e) => setKid({ ...kid, first: e.target.value })}
                />
                <input
                  required
                  maxLength={1}
                  placeholder="Last initial"
                  className={`${field} text-center uppercase`}
                  value={kid.initial}
                  onChange={(e) => setKid({ ...kid, initial: e.target.value })}
                />
              </div>
              <select
                required
                className={field}
                value={kid.grade}
                onChange={(e) => setKid({ ...kid, grade: e.target.value })}
              >
                <option value="">Grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g === "JK" || g === "SK" ? g : `Grade ${g}`}
                  </option>
                ))}
              </select>
              <input
                maxLength={200}
                placeholder="What will they make? (e.g. bracelets, cookies)"
                className={field}
                value={kid.makes}
                onChange={(e) => setKid({ ...kid, makes: e.target.value })}
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fff7c2] p-4 text-base">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--berry)]"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I&apos;m this child&apos;s parent or guardian. I agree to run
                  their shop on KalaCUBE, show their first name, last initial
                  and grade, and list photos of their crafts (not faces).
                  KalaCUBE handles all orders and deliveries, and 100% of sales
                  go to us.
                </span>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="jlps-btn jlps-btn-sun w-full"
              >
                {busy ? "Opening the shop…" : "Open the shop 🎉"}
              </button>
            </form>
          )}

          {step === "other-account" && user && (
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold">
                You&apos;re signed in as a KalaCUBE artist
              </h2>
              <p className="text-[#3b4a6b]">
                <b>{user.email}</b> already has a regular KalaCUBE artist
                account. To open your child&apos;s JLPS shop, sign out and use a
                different email.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  className="jlps-btn jlps-btn-sun"
                  onClick={() =>
                    run(async () => logout(), "Could not sign out.")
                  }
                >
                  Sign out
                </button>
                <Link href="/dashboard" className="jlps-btn jlps-btn-white">
                  Go to my dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
