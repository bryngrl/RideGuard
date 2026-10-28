# Registration and onboarding refinement

The Check Your Email screen checks the existing Firebase session in the foreground,
on app resume, and when a link opens the app. It requires `GET /auth/me` to return
`emailVerified: true` before continuing. Link parameters never grant access.
Resending uses the existing Firebase `sendEmailVerification` integration and shared
notification component, with a 60-second minimum cooldown.

Registration inputs stay in memory when returning from verification, including
password fields. Passwords are never written to storage or route parameters.
Continuing an already-created registration signs into that account instead of
creating it again. Editing a created account's username or email requires backend
support; the frontend reports this instead of pretending to update the account.

Onboarding draft fields and the last visited step persist on the device. Drafts
are cleared when ownership changes. This is device-local progress; restoring it
after reinstall or on another device needs backend onboarding state.

Hardware setup now leads to the existing MPIN flow before Setup Complete. MPIN
creation must return explicit success. Setup Complete checks server MPIN status
again and blocks completion if an MPIN is missing or cannot be confirmed.

## Backend status after endpoint audit (2026-10-25)

- The latest backend allows `/profile/personal-info` to complete a registration
  identity stub. `/auth/is-old-user` returns true only after `personalInfo` exists.
  The frontend now uses that distinction. An already completed profile still
  requires the existing `PATCH /profile/me` route for edits.
- Pending registration email/username changes have no documented endpoint. Provide
  authenticated update behavior, uniqueness validation, and verification resend
  behavior, including the validity of previously issued links.
- MPIN setup/unlock are enabled independently. Change and recovery remain blocked
  because the required email-link contracts and real delivery are not implemented.
  See [the current MPIN user flow](MPIN_USER_FLOW.md).
- Provide server onboarding step/completion state for reliable recovery on another
  device, after reinstall, and when deciding whether an existing profile has finished
  onboarding.

## Phone QA

- Register, go Back from verification, and confirm fields remain populated.
- Continue without edits and confirm no duplicate registration request is sent.
- Edit the registered email and confirm the original account is not silently changed.
- Resend once, observe the shared top notification, and check cooldown behavior.
- Verify outside the app, return, and confirm automatic navigation without a button.
- Test offline status checks, expired/used links, and navigating away during a check.
- Restart during each onboarding step and confirm the correct draft and step return.
- Navigate backward through forms and ensure saved profile creation is not repeated.
- Check lower fields above the Android keyboard and footer positions on small screens.
- After backend readiness, test MPIN mismatch, failed save, existing MPIN, and successful
  confirmation before Setup Complete. None of the failure cases should open Dashboard.
