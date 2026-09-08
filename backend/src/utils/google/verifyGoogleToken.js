import { OAuth2Client } from "google-auth-library";

let client = null;

export const verifyGoogleToken = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google sign-in is not configured on the server (missing GOOGLE_CLIENT_ID)");
  }
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  try{
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
  } catch(error) {
    console.error("Google token verification failed:", error.message)
    return null;
  }
};
