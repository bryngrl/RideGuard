import { Redirect } from "expo-router";

// Password changes happen through Firebase's reset link handler.
export default function NewPasswordRoute() {
  return <Redirect href="/(public)/forgot-password" />;
}
