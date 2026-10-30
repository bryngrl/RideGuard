import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OnboardingState {
  owner: string | null;
  savedProfile: string | null;
  savedContactId: string;
  setOwner: (owner: string) => void;
  firstName: string;
  lastName: string;
  phone: string;

  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;
  color: string;

  contactName: string;
  emergencyPhone: string;
  relationship: string;
  hardwareSetup: "" | "connection-skipped" | "tests-skipped";

  updateDraft: (
    data: Partial<Omit<OnboardingState, "updateDraft" | "clearDraft">>,
  ) => void;

  clearDraft: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      owner: null,
      savedProfile: null,
      savedContactId: "",
      setOwner: (owner) => {
        const current = useOnboardingStore.getState();
        if (current.owner !== owner) {
          current.clearDraft();
          set({ owner });
        }
      },
      firstName: "",
      lastName: "",
      phone: "",

      vehicleBrand: "",
      vehicleModel: "",
      plateNumber: "",
      color: "",

      contactName: "",
      emergencyPhone: "",
      relationship: "",
      hardwareSetup: "",

      updateDraft: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      clearDraft: () =>
        set({
          savedProfile: null,
          savedContactId: "",
          firstName: "",
          lastName: "",
          phone: "",

          vehicleBrand: "",
          vehicleModel: "",
          plateNumber: "",
          color: "",

          contactName: "",
          emergencyPhone: "",
          relationship: "",
          hardwareSetup: "",
        }),
    }),
    {
      name: "rideguard-registration-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
