import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureEmailPasswordProfile, getCurrentUser } from "./auth.api";
import { refreshFirebaseUser } from "./firebase-user-refresh";
import { postAuthDestination } from "./registration-progress";
import type { VerifiedEmailIdentity } from "./email-verification.api";

/** The server-verified code is not a Firebase session; establish both explicitly. */
export async function completeEmailVerification(identity: VerifiedEmailIdentity, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, identity.email, password);
  await refreshFirebaseUser(user);
  if (user.uid !== identity.uid || !user.emailVerified || auth.currentUser?.uid !== user.uid) {
    throw new Error("Your verified account does not match this session. Log in again.");
  }
  const current = await getCurrentUser(await user.getIdToken(true));
  if (current.uid !== user.uid || current.emailVerified !== true) throw new Error("Account verification was not confirmed.");
  const hasProfile = await ensureEmailPasswordProfile(user);
  const destination = await postAuthDestination(user, hasProfile);
  if (auth.currentUser?.uid !== user.uid) throw new Error("Your session changed. Log in again.");
  return { user, hasProfile, destination };
}
