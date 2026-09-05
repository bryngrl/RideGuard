import { create } from "zustand";

interface RegistrationState {
  // Step 1
  lastName: string;
  firstName: string;
  phone: string;

  // reg 2
  vehicleName: string;
  plateNumber: string;
  color: string;

  // reg 3 (Emergency Contact)
  contactName: string;
  emergencyPhone: string;
  relationship: string;

  updateProfile: (data: Partial<RegistrationState>) => void;
  resetForm: () => void;
}

export const useAuthStore = create<RegistrationState>((set) => ({
  lastName: "",
  firstName: "",
  phone: "",
  vehicleName: "",
  plateNumber: "",
  color: "",
  contactName: "",
  emergencyPhone: "",
  relationship: "",

  updateProfile: (data) => set((state) => ({ ...state, ...data })),

  resetForm: () =>
    set({
      lastName: "",
      firstName: "",
      phone: "",
      vehicleName: "",
      plateNumber: "",
      color: "",
      contactName: "",
      emergencyPhone: "",
      relationship: "",
    }),
}));
