import { useRouter } from "expo-router";
import { KeyboardAvoidingWrapper } from "@/shared/ui";
import { Spacing } from "@/shared/theme";
import { SettingsSearch } from "../../components/settings-search";

export function SearchScreen() {
  const router = useRouter();
  return (
    <KeyboardAvoidingWrapper contentContainerStyle={{ paddingTop: Spacing.three, paddingHorizontal: Spacing.four }}>
      <SettingsSearch active onOpen={() => undefined} onClose={() => router.back()} />
    </KeyboardAvoidingWrapper>
  );
}
