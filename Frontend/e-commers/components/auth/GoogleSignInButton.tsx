"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useWishlistStore } from "@/lib/store/wishlist";

// Minimal surface of Google Identity Services' global — just enough to
// initialize the button and read back the ID token it hands us.
interface GoogleCredentialResponse {
  credential: string;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Renders Google's own Sign-In button once its script + the ID token
 * verification on the backend are both configured. Until then (no
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID set), it renders a disabled placeholder
 * instead of a button that would just fail every click — see AGENTS
 * conversation: Google sign-in requires a Cloud Console OAuth client id.
 */
export function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const loginWithGoogleIdToken = useAuthStore((s) => s.loginWithGoogleIdToken);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
    // Intentionally not removed on unmount — Google's script is safe to
    // keep loaded for the rest of the session and re-inserting it on every
    // modal open/close would be wasteful.
  }, []);

  useEffect(() => {
    if (!CLIENT_ID || !scriptReady || !containerRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        const result = await loginWithGoogleIdToken(response.credential);
        if (!result.ok) {
          onError(result.error);
          return;
        }
        useWishlistStore.getState().resolvePending();
      },
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
    });
  }, [scriptReady, loginWithGoogleIdToken, onError]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in isn't configured yet (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID)"
        className="flex items-center justify-center gap-3 border border-line-strong py-3 text-sm font-medium text-ivory/35"
      >
        Continue with Google (not configured)
      </button>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
