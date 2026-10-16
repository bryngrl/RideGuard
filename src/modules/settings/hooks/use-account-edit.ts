import { useOnboardingStore } from "@/modules/onboarding";
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "@/shared/lib/phone-utils";
import { useEffect, useState } from "react";
import { updateProfile, updateVehicle } from "../services/settings.api";
import type { SettingsProfile } from "../types/settings.types";

// The photo isn't editable here, so the draft form omits it.
type EditableProfile = Omit<SettingsProfile, "photoUrl">;

function normalizeProfile(profile: EditableProfile): EditableProfile {
  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    phone: normalizePhoneNumber(profile.phone),
    email: profile.email.trim(),
    vehicleBrand: profile.vehicleBrand.trim(),
    vehicleModel: profile.vehicleModel.trim(),
    plateNumber: profile.plateNumber.trim(),
  };
}

export function useAccountEdit(profile: SettingsProfile) {
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [initialProfile, setInitialProfile] = useState(() =>
    normalizeProfile(profile),
  );
  const [form, setForm] = useState(initialProfile);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const normalizedProfile = normalizeProfile(profile);
    setInitialProfile(normalizedProfile);
    setForm(normalizedProfile);
  }, [profile]);

  const normalizedForm = normalizeProfile(form);
  const changed = Object.keys(initialProfile).some(
    (field) =>
      normalizedForm[field as keyof EditableProfile] !==
      initialProfile[field as keyof EditableProfile],
  );
  const phoneValid = isValidPhoneNumber(normalizedForm.phone);
  const valid = Boolean(
    normalizedForm.firstName && normalizedForm.lastName && phoneValid,
  );
  const setField = (field: keyof EditableProfile, value: string) =>
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
        firstName: normalizedForm.firstName,
        lastName: normalizedForm.lastName,
        phone: normalizedForm.phone,
      });
      await updateVehicle({
        vehicleBrand: normalizedForm.vehicleBrand,
        vehicleModel: normalizedForm.vehicleModel,
        plateNumber: normalizedForm.plateNumber,
      });
      updateDraft({ ...normalizedForm });
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
    phoneValid,
    valid,
    canSave: changed && valid && !saving,
    saving,
    error,
    save,
    reset: () => setForm(initialProfile),
  };
}
