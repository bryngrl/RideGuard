import { useOnboardingStore } from "@/modules/onboarding";
import {
    isValidPhoneNumber,
    normalizePhoneNumber,
} from "@/shared/lib/phone-utils";
import { useState } from "react";
import { updateProfile, updateVehicle } from "../services/settings.api";
import type { SettingsProfile } from "../types/settings.types";
export function useAccountEdit(profile: SettingsProfile) {
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [form, setForm] = useState(profile);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const changed = JSON.stringify(form) !== JSON.stringify(profile);
  const valid = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    isValidPhoneNumber(form.phone),
  );
  const setField = (field: keyof SettingsProfile, value: string) =>
    setForm((current) => ({
      ...current,
      [field]: field === "phone" ? normalizePhoneNumber(value) : value,
    }));
  const save = async () => {
    if (!changed || !valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      await updateVehicle({
        vehicleBrand: form.vehicleBrand,
        vehicleModel: form.vehicleModel,
        plateNumber: form.plateNumber,
      });
      updateDraft({ ...form });
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save your account.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  return {
    form,
    setField,
    changed,
    valid,
    saving,
    error,
    save,
    reset: () => setForm(profile),
  };
}
