import { OAuth2Client } from "google-auth-library";

let client = null;

/**
 * Verifies a Google Identity Services ID token and returns its payload
 * (name, email, sub/googleId, picture). Throws if GOOGLE_CLIENT_ID isn't
 * configured or the token doesn't check out (wrong audience, expired,
 * tampered, etc.) — callers should let that error propagate to
 * asyncHandler rather than swallow it.
 */
export const verifyGoogleToken = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google sign-in is not configured on the server (missing GOOGLE_CLIENT_ID)");
  }
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  return ticket.getPayload();
};
