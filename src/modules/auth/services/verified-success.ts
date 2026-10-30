import type { Href } from "expo-router";

// Memory-only handoff, armed by confirmed authentication. Route parameters can
// never manufacture verification. A restart resumes the normal auth checks.
let pending: { uid: string; destination: Href } | null = null;
export function beginVerifiedSuccess(uid: string, destination: Href) {
  pending = { uid, destination };
}
export function getVerifiedSuccess() { return pending; }
export function clearVerifiedSuccess() { pending = null; }
