import { useOnboardingStore } from "@/modules/onboarding";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "@/shared/lib/phone-utils";
import { validPlateInput } from "@/shared/lib/input-formats";
import { useEffect, useState } from "react";
import { updateAccountDetails } from "../services/settings.api";
import type { SettingsProfile } from "../types/settings.types";
import { useProfileCacheStore } from "../store/profile-cache.store";

// Photo uploads have a separate endpoint, so the text draft omits it.
type EditableProfile = Omit<SettingsProfile, "photoUrl">;
const editableFields = ["firstName", "lastName", "phone", "vehicleBrand", "vehicleModel", "plateNumber"] as const;

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
  const authUid = useAuthStore((state) => state.user?.uid);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [initialProfile, setInitialProfile] = useState(() =>
    normalizeProfile(profile),
  );
  const [form, setForm] = useState(initialProfile);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const normalizedForm = normalizeProfile(form);
  const changedFields = editableFields.filter(
    (field) =>
      normalizedForm[field] !== initialProfile[field],
  );
  const changed = changedFields.length > 0;
  useEffect(() => {
    // A profile refresh must not replace fields the user is already editing.
    if (changed) return;
    const normalizedProfile = normalizeProfile(profile);
    setInitialProfile(normalizedProfile);
    setForm(normalizedProfile);
  }, [changed, profile.firstName, profile.lastName, profile.phone, profile.email, profile.vehicleBrand, profile.vehicleModel, profile.plateNumber]);
  const phoneValid = isValidPhoneNumber(normalizedForm.phone);
  const fieldErrors = {
    firstName: !changedFields.includes("firstName") || normalizedForm.firstName ? undefined : "Enter your first name.",
    lastName: !changedFields.includes("lastName") || normalizedForm.lastName ? undefined : "Enter your last name.",
    phone: !changedFields.includes("phone") ? undefined : !normalizedForm.phone
      ? "Enter your mobile number."
      : phoneValid ? undefined : "Enter a valid 10-digit Philippine mobile number.",
    vehicleBrand: !changedFields.includes("vehicleBrand") || normalizedForm.vehicleBrand ? undefined : "Enter your vehicle brand.",
    vehicleModel: !changedFields.includes("vehicleModel") || normalizedForm.vehicleModel ? undefined : "Enter your vehicle model.",
    plateNumber: !changedFields.includes("plateNumber") ? undefined : !normalizedForm.plateNumber
      ? "Enter your plate number." : validPlateInput(normalizedForm.plateNumber) ? undefined : "Enter a valid vehicle plate number.",
  };
  const valid = Object.values(fieldErrors).every((message) => !message);
  const setField = (field: keyof EditableProfile, value: string) => {
    setError("");
    setForm((current) => ({
      ...current,
      [field]: field === "phone" ? normalizePhoneNumber(value) : value,
    }));
  };
  const save = async () => {
    setSubmitted(true);
    if (!changed || !valid || saving) return false;
    setSaving(true);
    setError("");
    try {
      const user = useAuthStore.getState().user;
      if (!user || user.uid !== authUid) throw new Error("Sign in to save your account.");
      const changes = Object.fromEntries(changedFields.map((field) => [field, normalizedForm[field]]));
      await updateAccountDetails(changes, await user.getIdToken());
      if (useAuthStore.getState().user?.uid !== user.uid) return false;
      updateDraft({ ...normalizedForm });
      if (authUid) useProfileCacheStore.getState().updateDetails(authUid, normalizedForm);
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
    fieldErrors,
    submitted,
    valid,
    canSave: changed && !saving,
    saving,
    error,
    save,
    reset: () => setForm(initialProfile),
  };
}
