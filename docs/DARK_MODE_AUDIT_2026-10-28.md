# RideGuard dark-mode audit — 28 October 2026

## Scope

Applied the supplied near-black, pale-text, blue-accent palette through the
existing theme hooks. Light remains the default. Manual Light/Dark choices and
System mode continue to use the existing persisted preference.

There is one color source: `src/shared/theme/colors.ts`. The legacy
`src/constants/theme.ts` re-exports its colors so older imports cannot select a
different palette. Navigation transition backgrounds now follow the app choice.

## Findings and changes

| Area | Source review and changes |
| --- | --- |
| Login, registration, email verification, password recovery | Shared form surfaces already used theme hooks. Fixed light-only Login title/links, brand ink and the Welcome background/glow/status bar. Verification and recovery continue through shared themed layouts. |
| Onboarding and hardware setup | Progress segments, logos, profile labels, permission icons and camera-number pills now follow the active theme. Hardware button images retain their supplied physical colors and existing event timing. |
| MPIN setup, unlock, change and recovery | Existing layouts, keypad, privacy cover and feedback use theme tokens. Shared brand ink, action buttons, disabled states and modal surfaces now have the new palette. Security flow and backend requests are unchanged. |
| Home | Replaced light-only monitoring/warning/danger card colors and decorative gradients. Camera/button icon ink and warning text now adapt. |
| Alerts and Archives | Unread rows, time, manual tags, false-alarm links, unread dots, dropdown surfaces and selection states now adapt. Alert-detail links/status text use theme tokens. |
| Emergency contacts | Contact list and form placeholders adapt. Detail/edit gradients use theme tokens; the supplied Group 82 artwork is used in dark mode at its original aspect ratio. Original light artwork is retained. Photos and loading behavior are unchanged. |
| Account and Settings | Profile card gradients and logos, settings icons, controls, search, informational pages and display previews use the shared palette. |
| Cameras and phone capture | Source-card icons and phone-capture warnings/errors now adapt. Video surfaces retain black backgrounds and white overlay controls. Feature flags, sessions and upload behavior are unchanged. |
| SOS | Start-screen contact placeholders and dark countdown colors adapt. The active SOS screen retains its red emergency surface and white controls intentionally. |
| Shared UI | Primary/outline/disabled buttons, focused inputs, selection ink, notifications, confirmations, photo sheet and ride summary use theme tokens. Dialog actions and app behavior are preserved. |

## Color decisions

- Dark background: `#030303`; main text: `#F5F7FF`; links: `#65A7FF`.
- Form/card surface: `#0B1018`; modal surface: `#111111`.
- Primary buttons: `#DFECFF` with dark text for contrast.
- Error text uses `#FF7075`; the stronger critical red remains available as
  `#FF0033`. Warning/danger cards use the supplied dark surfaces and readable
  foreground colors.
- The contact illustration uses the supplied dark artwork for
  the dark background, without replacing the light illustration.
- Media content, physical hardware illustrations and emergency-red warning
  surfaces are intentional theme exceptions.

## Validation and limits

`scripts/test-dark-theme.cjs` checks matching theme keys; contrast of normal-size
dark text on background/card/input/selected/modal/unread surfaces; feedback and
button contrast; actual button and alert-row rendering in both palettes;
progress colors; and manual versus System preference selection. Contact
navigation tests also cover selection of the correct background artwork.

The regression suite and TypeScript are run alongside these checks. These are
source/rendering tests, not screenshots from every screen on a physical phone.
The phone was connected for a later Contact Information review. Its full-width artwork, larger portrait, revised text sizes and retained number formatting were checked on-device. The remaining screens still need physical-device visual QA.

## Phone QA still required

- Select Dark in Settings → Display; reopen the app and unlock MPIN.
- Check Home monitoring states, Alerts filters/details and Settings Archives.
- Open a contact with and without a photo, edit it, and open its photo sheet
  and discard/delete dialogs without saving unwanted changes.
- Check Account, registration/onboarding forms, keyboard focus, email waiting
  screens, MPIN errors and recovery.
- Check Camera/Phone Camera controls on a compatible enabled Android build.
- Switch Light → Dark → System while the phone uses each appearance; confirm
  text, icons, notifications and navigation backgrounds update together.
- Verify SOS countdown/active visuals in a controlled test environment; do not
  send real emergency messages merely to review colors.

No push, build, or live SOS was performed for this dark-mode refinement. Dark-mode changes are committed on request; unrelated unfinished onboarding work remains uncommitted.
