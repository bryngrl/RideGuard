import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OnboardingState {
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

  updateDraft: (
    data: Partial<Omit<OnboardingState, "updateDraft" | "clearDraft">>,
  ) => void;

  clearDraft: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
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

      updateDraft: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      clearDraft: () =>
        set({
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
        }),
    }),
    {
      name: "rideguard-registration-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
