# SOS email delivery design

## Decision

RideGuard will send SOS email notifications from the backend, alongside SMS
submissions. The mobile app will never contain SMTP credentials or send the
email directly.

Email is sent when an SOS starts and when it ends. Every emergency contact must
have an email address before the contact can be saved. The email includes a
Google Maps link generated from the SOS location.

## Why this solves the local SMS-link problem

The SMS provider may filter messages containing URLs, but email is a separate
delivery channel. The SOS can therefore carry the map link in email while SMS
continues to carry the short emergency message. SMS and email must be tracked
independently; a successful SMS submission must not imply successful email
delivery, and vice versa.

## Current state

The mobile SOS contract currently models recipients with phone numbers and
submission status only:

```ts
recipients: {
  contactId: string;
  name: string;
  phone: string;
  initial: Submission;
  ended: Submission | null;
}[]
```

The backend already has SMTP-backed email delivery for account flows, but no
SOS email channel is exposed in the mobile SOS response contract.

## Proposed contract

Add the email address and an independent email submission to each SOS
recipient:

```ts
type SosRecipient = {
  contactId: string;
  name: string;
  phone: string;
  email: string;
  initial: Submission;
  ended: Submission | null;
  emailInitial: EmailSubmission;
  emailEnded: EmailSubmission | null;
};

type EmailSubmission = {
  status: "queued" | "sending" | "sent" | "delivered" | "failed" | "unknown";
  updatedAt: string;
  errorCode?: string;
};
```

The backend should snapshot the destination address and location at SOS
creation. Later contact edits must not change the meaning of an already-created
SOS.

## Message behavior

### SOS start email

- Subject: `RideGuard SOS - {rider name}`
- State that the rider raised an SOS.
- Include the captured location and timestamp.
- Include a link in the form
  `https://www.google.com/maps/search/?api=1&query={latitude},{longitude}`.
- Clearly label a location as **last known** when it is not a fresh GPS fix.
- Include the SOS identifier and a link to any authenticated RideGuard status
  page only if such a page is later implemented.

### SOS start SMS

The SMS deliberately contains no URL:

`RideGuard SOS: {rider name} needs help. Check your email for the map link.`

This wording is honest about where the map link is provided and avoids carrier
link filtering. Email delivery remains a separate status and is not implied by
SMS submission.

### SOS end email

- State that the rider ended the SOS.
- Include the end timestamp.
- Include the original location, still labeled as last known when applicable.
- Do not imply that the rider is safe merely because the SOS ended.

If no location exists at all, send the email without a map link and state that
location was unavailable. The selected product rule is to prefer notification
over suppressing the SOS email.

## Delivery and failure semantics

- Queue email work on the backend after the SOS is durably accepted.
- Do not block the mobile SOS activation on SMTP completion.
- Record per-recipient start and end email outcomes.
- Retry transient provider failures with a bounded policy and an idempotency key
  based on `sosId`, recipient ID, and message kind.
- Do not automatically resend from the mobile app after an ambiguous result.
- Avoid logging full email addresses, message bodies, map URLs, or location
  coordinates in normal application logs.
- The rider UI should show SMS and email statuses separately and should use
  wording such as “Email sent” or “Email delivery unconfirmed,” not “contact
  notified” unless the provider actually confirms delivery.

## Required implementation changes

1. Add a required, validated email field to the emergency-contact create/edit
   contract and UI.
2. Update backend SOS recipient snapshots and email queue processing.
3. Add email submission fields to the SOS response and validation types.
4. Add start/end email status presentation to the SOS active and ended screens.
5. Add backend tests for idempotency, stale-location labeling, provider failure,
   and contact-email changes after SOS creation.
6. Perform live acceptance testing with a real inbox and the configured SMTP
   deployment. Contract tests alone cannot prove delivery.

## Privacy and security

The contact form must tell the rider that the emergency contact's email will
receive SOS status and location information. Email addresses and location data
must be protected like phone numbers and SOS records, with authenticated
recipient management and backend authorization. The app must not call an SMTP
provider directly.
