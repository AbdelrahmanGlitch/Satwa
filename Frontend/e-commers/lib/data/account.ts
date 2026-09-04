import { apiFetch } from "@/lib/api";

export interface Profile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: "Male" | "Female";
  provider: "local" | "google";
  // Present only while a change-email request is awaiting its
  // confirmation code — see requestEmailChange/confirmEmailChange.
  pendingEmail?: string;
}

export async function getProfile(authHeader: string): Promise<Profile> {
  const res = await apiFetch<{ user: Profile }>("/users/profile", { authHeader });
  return res.user;
}

export interface ProfileInput {
  name?: string;
  phone?: string;
  address?: string;
  gender?: "Male" | "Female";
}

export async function updateProfile(authHeader: string, input: ProfileInput): Promise<Profile> {
  const res = await apiFetch<{ user: Profile }>("/users/updateProfile", {
    method: "PATCH",
    authHeader,
    body: input,
  });
  return res.user;
}

/** Sends a confirmation code to `newEmail` — the account's actual email doesn't change until confirmEmailChange succeeds. */
export async function requestEmailChange(authHeader: string, newEmail: string): Promise<void> {
  await apiFetch("/users/change-email", { method: "POST", authHeader, body: { newEmail } });
}

export async function confirmEmailChange(authHeader: string, code: string): Promise<{ email: string }> {
  return apiFetch<{ email: string }>("/users/confirm-email-change", {
    method: "POST",
    authHeader,
    body: { code },
  });
}

export async function changePassword(
  authHeader: string,
  input: { currentPassword: string; newPassword: string; cNewPassword: string }
): Promise<void> {
  await apiFetch("/users/change-password", { method: "PATCH", authHeader, body: input });
}
