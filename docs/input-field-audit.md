# Input field audit

The UI currently uses a visible `+63` prefix for phone entry. These forms retain a 10-digit national value (`9171234567`), display it as `917 123 4567`, and submit the same payloads as before. `input-formats.ts` also provides the requested 11-digit local formatter (`0917 123 4567`) for a field without the country prefix. Pasted `+63` and `09` numbers normalize to the national value in prefixed fields.

| Location | Inputs | Current rule and payload |
| --- | --- | --- |
| Create Account | Username, email, password, confirmation | Username follows existing 3–24 character account rule; email uses an email keyboard and trimmed validation; password policy and matching remain in existing utilities. This screen has no account creation endpoint yet. |
| Login | Username, password | Required demo credentials and Google login behavior preserved. |
| Forgot Password / New Password | Email, password, confirmation | Existing recovery validation, password policy and backend flow preserved. |
| OTP verification | Six-digit code | Existing shared input filters to six digits; native length limit removed so pasted formatted codes can be normalized. Expiry/resend behavior unchanged. |
| MPIN setup/unlock | Four-digit PIN | Existing masked keypad accepts four digits and controls automatic progression; security flow unchanged. |
| Personal Information onboarding | First name, last name, phone | Names are trimmed at submission. Prefixed phone uses shared formatting and 10-digit validation; payload remains `+63` plus national digits. |
| Vehicle Information onboarding | Brand, model, plate, color | Plate is uppercased, unsupported symbols removed and nonempty alphanumeric validation applied. No strict plate class mask or separator is imposed because the API accepts a string and no approved class list was found. Payload retains the entered separator. Other text fields keep their existing semantics. |
| Emergency Contact onboarding | Name, phone, relationship | Prefixed phone uses shared formatting and existing `+63` payload. Relationship remains a selector. |
| Emergency Contacts Add/Edit | Name, phone, relationship | Same national phone formatter, 10-digit validation and `+63` API payload. Existing photo flow unchanged. |
| Account Edit | Full name, phone, email, vehicle, plate | Phone formatting and plate normalization applied; email is read only. Profile and vehicle update endpoints are still unavailable in `settings.api.ts`, so this form cannot complete a save against a backend. |
| Camera Connection | Camera ID | Entry groups the value as `XXX-XXX-XXX`: three letters, three digits, then three letters. The first group is not fixed to `CAM`. Invalid characters remain visible for correction; submission requires the complete pattern and sends the entered ID to the existing claim endpoint. Live firmware validation was not available in this repo. |
| Quick Button Connection | Button ID | Entry uses the same `XXX-XXX-XXX` pattern without requiring `BUT` in the first group. Invalid characters remain visible for correction; submission requires the complete pattern and sends the entered ID to the existing claim endpoint. |
| Settings | Search | Free-text search remains unrestricted apart from existing UI behavior. |

Structured phone, camera, and Quick Button fields use `CustomTextInput.inputFormat`: forms keep raw values while the field renders separators. Device dashes appear immediately after the third and sixth characters, with the caret after each dash. The shared field briefly controls caret placement during formatting, then releases it so the user can move the cursor normally. Incorrect device characters remain visible until the user corrects them; the field shows "Incorrect format." on blur or submit. Native device QA is still needed for platform-specific paste, selection, accessibility scaling, and hardware pairing behavior.
