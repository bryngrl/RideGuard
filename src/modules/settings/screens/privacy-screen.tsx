import { InformationPage, type InformationSection } from "../components/information-page";

const sections: InformationSection[] = [
  {
    title: "1. About this policy",
    paragraphs: [
      "This policy describes information handled by RideGuard while it supports account access, camera monitoring, safety alerts, and emergency-contact features for car-based TNVS drivers. It distinguishes features available in this version from controls that are still being developed.",
    ],
  },
  {
    title: "2. Information handled",
    paragraphs: [
      "Account and profile information can include a sign-in identity, name, email address, phone number, profile photo, and vehicle details such as brand, model, and plate number. The profile and photo features send information to RideGuard's service when used.",
      "Camera and device information can include an installation or device identifier, connection status, and a camera session. A user-started phone-camera session sends images for analysis. Alert records returned by the service can include a device ID, message, time, false-alarm and seen status, and links to images or video clips.",
      "If you add emergency contacts, the app sends their name, phone number, relationship, and any optional photo to RideGuard's service. Display, notification, retention, location-sharing, and recent-search preferences are stored on your device in this version.",
      "The onboarding flow can request location permission while the app is in use. This version does not read or send your precise location, and the Settings location-sharing switches are not connected to a sharing service.",
    ],
  },
  {
    title: "3. How information is used",
    paragraphs: [
      "Account details support sign-in and profile display. Camera images support threat analysis, while alert data supports notifications, incident review, and false-alarm marking. Contact details support your emergency-contact list. Preferences saved on your device do not mean a service-wide retention or location-sharing rule has taken effect.",
    ],
  },
  {
    title: "4. Cameras and media",
    paragraphs: [
      "When you start phone-camera monitoring on a supported device, the app starts a timed upload session and sends periodic photos to the processing service, including while the app is in the background if the session remains active. You can stop that session in the app. A connected camera may provide a live view.",
      "Alerts can contain links to captured images or video clips. The app does not establish that every live frame or uploaded photo is stored as evidence. Where media is stored, its storage location and deletion schedule still require confirmation from the service operator.",
    ],
  },
  {
    title: "5. AI-assisted detection",
    paragraphs: [
      "Image analysis may identify possible weapons or violent activity and return an alert. These results can be wrong or incomplete; a false alarm may occur, and a real threat may be missed. The app lets you mark some alerts as false alarms, but that does not make detection infallible.",
    ],
  },
  {
    title: "6. Sharing and connected services",
    paragraphs: [
      "The app uses Google and Firebase for sign-in, RideGuard backend services for profiles, contacts, cameras, and alerts, and Ably for real-time alert delivery. Camera images are transmitted to a processing endpoint when a phone-camera session is active. The service operator must confirm any additional processors, recipients, or disclosures.",
      "This version of the app does not confirm that opening the SOS flow sends details to emergency contacts or emergency services. The Settings switches also do not activate automatic location sharing.",
    ],
  },
  {
    title: "7. Storage and retention",
    paragraphs: [
      "The app stores Settings choices and recent Settings destinations on your device. Accounts, contacts, camera sessions, and alerts involve RideGuard's services. The retention choices shown in Settings are device preferences in this version; actual service retention periods, storage locations, and deletion procedures have not been verified.",
    ],
  },
  {
    title: "8. Security",
    paragraphs: [
      "Signed-in requests use an access token, and phone-camera uploads use a separate session token. These measures do not guarantee absolute security. MPIN screens exist, but MPIN setup and verification are not available in this version, so MPIN is not described here as active account protection.",
    ],
  },
  {
    title: "9. Your choices and privacy rights",
    paragraphs: [
      "You can stop a phone-camera session, manage emergency contacts, and change Settings choices saved on your device. This version does not provide a complete account-data export or deletion flow. Under the Philippine Data Privacy Act of 2012, applicable rights may include being informed, access, correction, objection, and erasure in qualifying circumstances, as well as lodging a complaint with the National Privacy Commission.",
    ],
  },
  {
    title: "10. Emergency contacts and SOS",
    paragraphs: [
      "Contact details you enter are sent to RideGuard's service so your list can be displayed and managed. The manual SOS screens do not confirm delivery to those contacts in this version, and automatic SOS preferences are currently disabled. Contact-notification and location-sharing behavior need confirmation before they can be described as active.",
    ],
  },
  {
    title: "11. Policy updates",
    paragraphs: [
      "This text may change as the service and its data practices are confirmed. Updated text can be shown in the app. The process for notifying users of material changes has not yet been established.",
    ],
  },
  {
    title: "12. Privacy contact",
    paragraphs: [
      "Official privacy contact details and the responsible data controller have not yet been provided for this policy. These details must be added before the policy is finalized.",
    ],
  },
];

export function PrivacyScreen() {
  return <InformationPage title="Privacy Policy" sections={sections} />;
}
