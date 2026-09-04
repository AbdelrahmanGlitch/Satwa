import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, ApiError } from "@/lib/api";

export type AuthStatus = "guest" | "user" | "admin";
export type AuthModalTab = "login" | "register";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface BackendUser {
  _id: string;
  name: string;
  email: string;
}

type Result = { ok: true } | { ok: false; error: string };

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  // Ready-to-send `Authorization` header value ("bearer <token>" for a
  // user, "admin <token>" for an admin) — the API tells the two apart by
  // this prefix, see backend/src/middleware/authrization.js.
  authHeader: string | null;
  // zustand's persist middleware reads localStorage asynchronously, so on
  // first paint `status` is always "guest" even for a returning admin/user.
  // Guards must wait for hasHydrated before redirecting on `status`, or
  // they'll bounce a genuinely signed-in visitor on every hard refresh.
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  isAuthModalOpen: boolean;
  authModalTab: AuthModalTab;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: AuthModalTab) => void;

  loginWithPassword: (email: string, password: string) => Promise<Result>;
  registerWithPassword: (input: {
    name: string;
    email: string;
    password: string;
    cPassword: string;
    gender: "Male" | "Female";
    phone: string;
  }) => Promise<Result>;
  confirmEmail: (email: string, code: string) => Promise<Result>;
  loginWithGoogleIdToken: (idToken: string) => Promise<Result>;
  loginAsAdmin: (email: string, password: string) => Promise<Result>;
  // Patches the locally-cached name/email after a profile/email-change
  // save (lib/data/account.ts) so the header and anywhere else `user` is
  // read update immediately, without needing a full page reload.
  updateLocalUser: (patch: Partial<Pick<AuthUser, "name" | "email">>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: "guest",
      user: null,
      authHeader: null,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      isAuthModalOpen: false,
      authModalTab: "login",

      openAuthModal: (tab = "login") =>
        set({ isAuthModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setAuthModalTab: (tab) => set({ authModalTab: tab }),

      loginWithPassword: async (email, password) => {
        try {
          const res = await apiFetch<{ user: BackendUser; token: string }>("/users/signIn", {
            method: "POST",
            body: { email, password },
          });
          set({
            status: "user",
            user: { id: res.user._id, name: res.user.name, email: res.user.email },
            authHeader: `bearer ${res.token}`,
            isAuthModalOpen: false,
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: errorMessage(err, "Could not sign in.") };
        }
      },

      registerWithPassword: async ({ name, email, password, cPassword, gender, phone }) => {
        try {
          await apiFetch("/users/signUp", {
            method: "POST",
            body: { name, email, password, cPassword, gender, phone },
          });
          // Account exists but is unconfirmed — the modal switches to an
          // OTP-entry step rather than signing in immediately, matching
          // the backend's confirm-email-first requirement.
          return { ok: true };
        } catch (err) {
          return { ok: false, error: errorMessage(err, "Could not create your account.") };
        }
      },

      confirmEmail: async (email, code) => {
        try {
          await apiFetch("/users/confirmEmail", { method: "POST", body: { email, code } });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: errorMessage(err, "That code didn't work.") };
        }
      },

      loginWithGoogleIdToken: async (idToken) => {
        try {
          const res = await apiFetch<{ user: BackendUser; token: string }>("/users/google", {
            method: "POST",
            body: { idToken },
          });
          set({
            status: "user",
            user: { id: res.user._id, name: res.user.name, email: res.user.email },
            authHeader: `bearer ${res.token}`,
            isAuthModalOpen: false,
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: errorMessage(err, "Google sign-in failed.") };
        }
      },

      loginAsAdmin: async (email, password) => {
        try {
          const res = await apiFetch<{ token: string }>("/admin/login", {
            method: "POST",
            body: { email, password },
          });
          set({
            status: "admin",
            user: { id: "", name: "Admin", email },
            authHeader: `admin ${res.token}`,
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: errorMessage(err, "Invalid admin credentials.") };
        }
      },

      updateLocalUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : {})),

      logout: () => set({ status: "guest", user: null, authHeader: null }),
    }),
    {
      name: "satwa-auth",
      partialize: (state) => ({ status: state.status, user: state.user, authHeader: state.authHeader }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
