import { Redirect } from "expo-router";

// The backend sends Firebase password-reset links instead of OTP codes.
export default function VerifyCodeRoute() {
  return <Redirect href="/(public)/forgot-password" />;
}
