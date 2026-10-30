import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { createContact, listContacts, updateContact } from "@/modules/emergency-contacts/services/contacts.api";
import { apiClient } from "@/shared/api";
import { APIError } from "@/shared/api/errors";
import { nationalMobile } from "@/shared/lib/input-formats";
import { useOnboardingStore } from "../store/onboarding.store";
import { submitProfile, type ProfilePayload } from "./onboarding.api";

/** Profile completion and Settings contacts have different backend contracts. */
export async function saveOnboardingDetails(payload: ProfilePayload, includeContact: boolean) {
  const user = auth.currentUser;
  if (!user || useAuthStore.getState().user?.uid !== user.uid) throw new Error("Session expired. Log in again.");
  const current = () => {
    if (auth.currentUser?.uid !== user.uid || useAuthStore.getState().user?.uid !== user.uid ||
      useOnboardingStore.getState().owner !== user.uid) throw new Error("Account changed. Reopen setup.");
  };
  current();
  const { contact_name, emergency_phone_number, relationship, ...profile } = payload;
  const snapshot = JSON.stringify(profile);
  const token = await user.getIdToken();
  current();
  const saved = useOnboardingStore.getState().savedProfile;
  let sameProfile = saved === snapshot;
  // Recognize the earlier combined checkpoint without resubmitting a confirmed profile.
  if (!sameProfile && saved) {
    try {
      const { contact_name: _name, emergency_phone_number: _phone, relationship: _relationship, ...old } = JSON.parse(saved);
      sameProfile = Object.keys(profile).every((key) => old[key] === profile[key as keyof typeof profile]);
    } catch { /* Invalid checkpoints cannot suppress a server save. */ }
  }
  if (!sameProfile) {
    let response;
    try { response = await submitProfile(profile, token); }
    catch (error) {
      if (!(error instanceof APIError) || error.status !== 422) throw error;
      current();
      // Registration/retry may already have created personalInfo. Use the existing
      // update route rather than trapping setup in a repeated create request.
      response = await apiClient.patch<{ success: boolean }>("/profile/me", profile, token);
    }
    current();
    if (response?.success !== true) throw new Error("Profile save was not confirmed.");
    useOnboardingStore.getState().updateDraft({ savedProfile: snapshot });
  }
  current();
  if (includeContact) {
    if (!contact_name || !emergency_phone_number || !relationship) throw new Error("Complete the contact details.");
    // A fresh GET reconciles a successful POST whose response was lost and the
    // earlier backend's embedded-contact migration, avoiding duplicate retries.
    const contacts = await listContacts({ force: true });
    current();
    const savedId = useOnboardingStore.getState().savedContactId;
    const existing = contacts.find((contact) => contact.id === savedId) ??
      contacts.find((contact) => nationalMobile(contact.phoneNumber) === nationalMobile(emergency_phone_number));
    const input = { name: contact_name, phone: emergency_phone_number, relationship };
    const unchanged = existing && existing.name === input.name && existing.relationship === input.relationship &&
      nationalMobile(existing.phoneNumber) === nationalMobile(input.phone);
    const contact = unchanged ? existing : existing
      ? await updateContact(existing.id, input) : await createContact(input);
    current();
    useOnboardingStore.getState().updateDraft({ savedContactId: contact.id });
  }
  current();
  useAuthStore.getState().setIsOldUser(true);
}
