"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/auth";
import {
  getProfile,
  updateProfile,
  requestEmailChange,
  confirmEmailChange,
  changePassword,
  type Profile,
} from "@/lib/data/account";
import { ApiError } from "@/lib/api";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 focus:border-accent focus:outline-none disabled:opacity-50";
const labelClass = "text-xs uppercase tracking-[0.18em] text-ivory/50";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line p-8">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** Name / phone / address / gender — a single direct-update form. */
function ProfileInfoForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const authHeader = useAuthStore((s) => s.authHeader);
  const updateLocalUser = useAuthStore((s) => s.updateLocalUser);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [gender, setGender] = useState<"Male" | "Female">(profile.gender ?? "Male");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const updated = await updateProfile(authHeader!, { name, phone, address, gender });
      onSaved(updated);
      updateLocalUser({ name: updated.name });
      setNotice("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your changes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Name</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Gender</label>
          <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value as "Male" | "Female")}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Address</label>
        <textarea
          className={inputClass}
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {notice && <p className="text-xs text-accent">{notice}</p>}

      <Button type="submit" disabled={submitting} className="mt-1 w-fit">
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

/** Current email + a two-step change flow: request a code, then confirm it — the account's email only changes once confirmed. */
function EmailForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const authHeader = useAuthStore((s) => s.authHeader);
  const updateLocalUser = useAuthStore((s) => s.updateLocalUser);

  const [changing, setChanging] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(profile.pendingEmail ?? null);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestEmailChange(authHeader!, newEmail);
      setPendingEmail(newEmail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a confirmation code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await confirmEmailChange(authHeader!, code);
      onSaved({ ...profile, email: res.email, pendingEmail: undefined });
      updateLocalUser({ email: res.email });
      setPendingEmail(null);
      setChanging(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code didn't work.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingEmail) {
    return (
      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        <p className="text-sm text-ivory/60">
          We sent a code to <span className="text-ivory">{pendingEmail}</span>. Enter it below to confirm the change.
        </p>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Confirmation code</label>
          <input
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            required
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Confirming…" : "Confirm new email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setPendingEmail(null); setError(null); }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (!changing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ivory/70">{profile.email}</p>
        <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
          Change email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleRequest} className="flex flex-col gap-4">
      <p className="text-sm text-ivory/60">Current: {profile.email}</p>
      <div className="flex flex-col gap-2">
        <label className={labelClass}>New email</label>
        <input
          type="email"
          className={inputClass}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? "Sending…" : "Send confirmation code"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setChanging(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const authHeader = useAuthStore((s) => s.authHeader);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [cNewPassword, setCNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword !== cNewPassword) {
      setError("New password and confirm password don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(authHeader!, { currentPassword, newPassword, cNewPassword });
      setCurrentPassword("");
      setNewPassword("");
      setCNewPassword("");
      setNotice("Password updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Current password</label>
        <input
          type="password"
          className={inputClass}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>New password</label>
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Confirm new password</label>
          <input
            type="password"
            className={inputClass}
            value={cNewPassword}
            onChange={(e) => setCNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </div>
      <p className="-mt-1 text-xs text-ivory/40">
        8+ characters, with at least one uppercase letter, one lowercase letter, and one number.
      </p>

      {error && <p className="text-xs text-danger">{error}</p>}
      {notice && <p className="text-xs text-accent">{notice}</p>}

      <Button type="submit" disabled={submitting} className="mt-1 w-fit">
        {submitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const authHeader = useAuthStore((s) => s.authHeader);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (hasHydrated && status === "guest") {
      router.replace("/");
      openAuthModal("login");
    }
  }, [hasHydrated, status, router, openAuthModal]);

  useEffect(() => {
    if (status === "user" && authHeader) {
      getProfile(authHeader).then(setProfile);
    }
  }, [status, authHeader]);

  if (!hasHydrated || status === "guest") return null;

  return (
    <main className="flex-1">
      <section className="border-b border-line py-16 text-center">
        <Container>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-accent">Your account</p>
          <h1 className="mt-5 font-display text-5xl">Profile</h1>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-2xl">
          {!profile ? (
            <p className="text-center text-sm text-ivory/50">Loading…</p>
          ) : (
            <div className="flex flex-col gap-8">
              <SectionCard title="Profile information">
                <ProfileInfoForm profile={profile} onSaved={setProfile} />
              </SectionCard>

              {profile.provider === "local" && (
                <>
                  <SectionCard title="Email">
                    <EmailForm profile={profile} onSaved={setProfile} />
                  </SectionCard>

                  <SectionCard title="Password">
                    <PasswordForm />
                  </SectionCard>
                </>
              )}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
