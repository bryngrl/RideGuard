import type { Href } from "expo-router";

// Memory-only handoff, armed by confirmed authentication or a server-verified
// email code. Without authentication its destination is Login, never protected
// content. Route parameters cannot manufacture a successful verification.
let pending: { uid: string; destination: Href } | null = null;
export function beginVerifiedSuccess(uid: string, destination: Href) {
  pending = { uid, destination };
}
export function getVerifiedSuccess() { return pending; }
export function clearVerifiedSuccess() { pending = null; }
