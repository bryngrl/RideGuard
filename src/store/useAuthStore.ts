import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RegistrationState {
  lastName: string;
  firstName: string;
  phone: string;

  vehicleName: string;
  plateNumber: string;
  color: string;

  contactName: string;
  emergencyPhone: string;
  relationship: string;

  updateProfile: (data: Partial<RegistrationState>) => void;
  resetForm: () => void;
}

const initialState = {
  lastName: "",
  firstName: "",
  phone: "",
  vehicleName: "",
  plateNumber: "",
  color: "",
  contactName: "",
  emergencyPhone: "",
  relationship: "",
};

export const useAuthStore = create<RegistrationState>()(
  persist(
    (set) => ({
      ...initialState,

      updateProfile: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      resetForm: () => set(initialState),
    }),
    {
      name: "rideguard-registration-storage",

      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
