import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  firstName: string;
  lastName: string;
  phone: string;
  vehicleName: string;
  plateNumber: string;
  color: string;
  contactName: string;
  emergencyPhone: string;
  relationship: string;
  updateDraft: (data: Partial<OnboardingState>) => void;
  clearDraft: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      firstName: "",
      lastName: "",
      phone: "",
      vehicleName: "",
      plateNumber: "",
      color: "",
      contactName: "",
      emergencyPhone: "",
      relationship: "",
      updateDraft: (data) => set((state) => ({ ...state, ...data })),
      clearDraft: () => set({
        firstName: "", lastName: "", phone: "",
        vehicleName: "", plateNumber: "", color: "",
        contactName: "", emergencyPhone: "", relationship: ""
      }),
    }),
    {
      name: "rideguard-onboarding-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);