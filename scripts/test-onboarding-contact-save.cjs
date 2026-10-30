const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
const payload = { first_name: "Ana", last_name: "Reyes", phone_number: "+639123456789",
  brand: "Honda", model: "Click", plate_number: "ABC123", color: "Red",
  contact_name: "Ben", emergency_phone_number: "+639987654321", relationship: "Sibling" };
function setup() {
  const calls = [], contacts = [];
  const state = { owner: "a", savedProfile: null, savedContactId: "", updateDraft: data => Object.assign(state, data) };
  const user = { uid: "a", getIdToken: async () => "fixture-token" };
  const auth = { currentUser: user }, authState = { user, setIsOldUser: value => calls.push(["old-user", value]) };
  class APIError extends Error { constructor(status) { super("fixture"); this.status = status; } }
  const controls = { failProfile: false, failContact: false, lostResponse: false, switchOwner: false, existingProfile: false };
  const modules = {
    "@/lib/firebase": { auth }, "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => authState } },
    "../store/onboarding.store": { useOnboardingStore: { getState: () => state } },
    "@/shared/api/errors": { APIError },
    "@/shared/api": { apiClient: { patch: async (route, body) => { calls.push(["patch", route, body]); return { success: true }; } } },
    "@/shared/lib/input-formats": { nationalMobile: text => text.replace(/\D/g, "").replace(/^(63|0)/, "") },
    "./onboarding.api": { submitProfile: async body => {
      calls.push(["profile", body]);
      if (controls.failProfile) throw Error("network");
      if (controls.existingProfile) throw new APIError(422);
      if (controls.switchOwner) auth.currentUser = { uid: "b" };
      return { success: true };
    } },
    "@/modules/emergency-contacts/services/contacts.api": {
      listContacts: async ({ force }) => { assert.equal(force, true); calls.push(["list"]); return contacts; },
      createContact: async input => {
        calls.push(["create", input]); if (controls.failContact) throw Error("network");
        const saved = { id: "c1", name: input.name, phoneNumber: input.phone, relationship: input.relationship };
        contacts.push(saved); if (controls.lostResponse) throw Error("response lost"); return saved;
      },
      updateContact: async (id, input) => {
        calls.push(["update", id, input]); const contact = contacts.find(item => item.id === id);
        Object.assign(contact, { name: input.name, phoneNumber: input.phone, relationship: input.relationship }); return contact;
      },
    },
  };
  const context = { exports: {}, require(name) { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/onboarding/services/save-onboarding-details.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return { calls, contacts, state, controls, save: (data = payload, contact = true) => context.exports.saveOnboardingDetails(data, contact) };
}
test("onboarding saves the contact through the same list contract as Settings", async () => {
  const app = setup(); await app.save();
  assert.equal(app.calls[0][0], "profile");
  assert.equal(app.calls[0][1].contact_name, undefined);
  assert.equal(app.contacts[0].name, "Ben"); assert.equal(app.state.savedContactId, "c1");
  await app.save(); assert.equal(app.calls.filter(call => call[0] === "profile").length, 1);
  assert.equal(app.calls.filter(call => call[0] === "create").length, 1);
});
test("a failed contact save retries without recreating the confirmed profile", async () => {
  const app = setup(); app.controls.failContact = true; await assert.rejects(app.save());
  assert.ok(app.state.savedProfile); app.controls.failContact = false; await app.save();
  assert.equal(app.calls.filter(call => call[0] === "profile").length, 1); assert.equal(app.contacts.length, 1);
});
test("a lost contact-create response is reconciled without making a duplicate", async () => {
  const app = setup(); app.controls.lostResponse = true; await assert.rejects(app.save());
  app.controls.lostResponse = false; await app.save(); assert.equal(app.contacts.length, 1);
  assert.equal(app.calls.filter(call => call[0] === "create").length, 1);
});
test("editing an onboarding contact updates its saved ID even when the number changes", async () => {
  const app = setup(); await app.save(); await app.save({ ...payload, emergency_phone_number: "+639111111111" });
  assert.equal(app.contacts.length, 1); assert.equal(app.contacts[0].phoneNumber, "+639111111111");
  assert.equal(app.calls.filter(call => call[0] === "update").length, 1);
});
test("skipping the optional contact does not save its draft or block profile completion", async () => {
  const app = setup(); await app.save(payload, false); assert.equal(app.contacts.length, 0);
  assert.equal(app.calls.some(call => call[0] === "list"), false); assert.ok(app.state.savedProfile);
});
test("profile failure or account change prevents writing a contact to another account", async () => {
  for (const reason of ["failProfile", "switchOwner"]) {
    const app = setup(); app.controls[reason] = true; await assert.rejects(app.save());
    assert.equal(app.contacts.length, 0); assert.equal(app.state.savedProfile, null);
  }
});
test("existing personal info uses the profile update route before creating the contact", async () => {
  const app = setup(); app.controls.existingProfile = true; await app.save();
  assert.equal(app.calls.find(call => call[0] === "patch")[1], "/profile/me"); assert.equal(app.contacts.length, 1);
});
