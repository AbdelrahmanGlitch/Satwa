"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LionMark } from "@/components/ui/LionMark";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const loginAsAdmin = useAuthStore((s) => s.loginAsAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await loginAsAdmin(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm border border-line-strong bg-surface p-10">
        <div className="flex flex-col items-center text-center">
          <LionMark className="h-10 w-10" />
          <h1 className="mt-4 font-display text-2xl">Satwa Admin</h1>
          <p className="mt-2 text-sm text-ivory/55">
            Sign in to manage products and collections.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
