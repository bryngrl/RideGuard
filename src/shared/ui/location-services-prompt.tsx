import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMpinStore } from "@/modules/mpin/store/mpin.store";
import { useLocationServicesPrompt } from "@/shared/hooks/use-location-services-prompt";

export function LocationServicesPrompt() {
  const uid = useAuthStore((state) => state.user?.uid);
  const unlocked = useMpinStore((state) => !!uid && state.owner === uid && state.unlocked);
  useLocationServicesPrompt(unlocked);
  return null;
}
