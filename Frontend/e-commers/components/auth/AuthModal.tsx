"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { LionMark } from "@/components/ui/LionMark";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthStore, type AuthModalTab } from "@/lib/store/auth";
import { useWishlistStore } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none";

/**
 * Owns all per-session form state (fields, error, notice, submitting).
 * Mounted fresh each time the modal opens and re-keyed by `tab` on every
 * switch between login/register, so state resets by unmount/remount
 * instead of by setState-in-effect.
 */
function AuthModalForm({
  tab,
  closeAuthModal,
  setAuthModalTab,
}: {
  tab: AuthModalTab;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: AuthModalTab) => void;
}) {
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const registerWithPassword = useAuthStore((s) => s.registerWithPassword);
  const confirmEmail = useAuthStore((s) => s.confirmEmail);

  // "confirm" only ever applies to the register tab, right after a
  // successful sign-up — the backend requires the emailed code before the
  // account can sign in at all.
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (tab === "login") {
      const result = await loginWithPassword(email, password);
      setSubmitting(false);
      if (!result.ok) return setError(result.error);
      useWishlistStore.getState().resolvePending();
      return;
    }

    if (password !== confirmPassword) {
      setSubmitting(false);
      return setError("Passwords don't match.");
    }
    const result = await registerWithPassword({ name, email, password, cPassword: confirmPassword, gender, phone });
    setSubmitting(false);
    if (!result.ok) return setError(result.error);
    setStep("confirm");
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await confirmEmail(email, code);
    if (!result.ok) {
      setSubmitting(false);
      return setError(result.error);
    }
    // Confirmed — sign them straight in rather than making them re-enter
    // credentials on a second screen.
    const signInResult = await loginWithPassword(email, password);
    setSubmitting(false);
    if (!signInResult.ok) return setError(signInResult.error);
    useWishlistStore.getState().resolvePending();
  }

  if (step === "confirm") {
    return (
      <>
        <button
          onClick={closeAuthModal}
          aria-label="Close"
          className="absolute right-5 top-5 text-ivory/50 hover:text-accent"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <LionMark className="h-10 w-10" />
          <h2 className="mt-4 font-display text-2xl">Check your email</h2>
          <p className="mt-2 text-sm text-ivory/55">
            We sent a code to {email}. Enter it below to confirm your account.
          </p>
        </div>
        <form onSubmit={handleConfirm} className="mt-7 flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? "Please wait…" : "Verify & sign in"}
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <button
        onClick={closeAuthModal}
        aria-label="Close"
        className="absolute right-5 top-5 text-ivory/50 hover:text-accent"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center text-center">
        <LionMark className="h-10 w-10" />
        <h2 className="mt-4 font-display text-2xl">
          {tab === "login" ? "Welcome back" : "Join Satwa"}
        </h2>
        <p className="mt-2 text-sm text-ivory/55">
          {tab === "login"
            ? "Sign in to save favorites and track your orders."
            : "Create an account to save favorites and check out faster."}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 w-full">
        <GoogleSignInButton onError={setNotice} />
        {notice && <p className="text-center text-xs text-ivory/45">{notice}</p>}
      </div>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-ivory/40">
          or
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {tab === "register" && (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "Male" | "Female")}
                className={inputClass}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input
                type="tel"
                placeholder="Phone (e.g. 01012345678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </>
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className={inputClass}
        />
        {tab === "register" && (
          <p className="-mt-2 text-xs text-ivory/40">
            8+ characters, with at least one uppercase letter, one lowercase letter, and one number.
          </p>
        )}
        {tab === "register" && (
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ivory/55">
        {tab === "login" ? (
          <>
            New to Satwa?{" "}
            <button
              onClick={() => setAuthModalTab("register")}
              className={cn("font-medium text-accent hover:text-accent-bright")}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setAuthModalTab("login")}
              className={cn("font-medium text-accent hover:text-accent-bright")}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </>
  );
}

export function AuthModal() {
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const authModalTab = useAuthStore((s) => s.authModalTab);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const setAuthModalTab = useAuthStore((s) => s.setAuthModalTab);
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuthModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAuthModal]);

  // Mounted once at the root, so this is a convenient single place to pull
  // the signed-in user's wishlist down from the server — fires whenever
  // `status` becomes "user", whether that's a fresh login/register/Google
  // sign-in just now or a returning session rehydrating from localStorage.
  useEffect(() => {
    if (hasHydrated && status === "user") {
      useWishlistStore.getState().hydrateFromServer();
    }
  }, [hasHydrated, status]);

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
            onClick={closeAuthModal}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md border border-line-strong bg-surface p-8 shadow-2xl md:p-10"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <AuthModalForm
              key={authModalTab}
              tab={authModalTab}
              closeAuthModal={closeAuthModal}
              setAuthModalTab={setAuthModalTab}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
