import type { User as FirebaseUser } from "firebase/auth";

export type AuthUser = FirebaseUser;

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}