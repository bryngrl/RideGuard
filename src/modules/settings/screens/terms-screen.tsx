import { InformationPage, type InformationSection } from "../components/information-page";

const sections: InformationSection[] = [
  {
    title: "1. Introduction and acceptance",
    paragraphs: [
      "RideGuard is intended to help car-based Transport Network Vehicle Service (TNVS) drivers recognize and respond to possible safety risks. These terms explain the features available in the app and their limits. Please read them before using RideGuard.",
    ],
  },
  {
    title: "2. What RideGuard does",
    paragraphs: [
      "The app supports account access, connected-camera viewing, user-started phone-camera monitoring, AI-assisted threat alerts, alert records, emergency contacts, and an SOS interface. Available features depend on the connected device, permissions, account, and service configuration.",
    ],
  },
  {
    title: "3. Accounts and your information",
    paragraphs: [
      "Sign-in is used to access account-specific information. Keep your sign-in methods and devices secure, and provide accurate contact and vehicle details when you choose to add them. Some profile fields cannot currently be edited through the app.",
    ],
  },
  {
    title: "4. Cameras and authorized use",
    paragraphs: [
      "When you start a supported phone-camera session, the app can capture and send periodic images for threat analysis. Connected cameras may also provide a live view. Use recording and monitoring only where you are authorized, and follow applicable rules on passenger notice and consent.",
    ],
  },
  {
    title: "5. AI-assisted detection",
    paragraphs: [
      "RideGuard can flag possible weapons or violent activity, but automated analysis may produce false alarms or miss a real threat. An alert is information to assess, not a confirmation that an incident occurred. RideGuard cannot guarantee detection, prevention, or driver or passenger safety.",
    ],
  },
  {
    title: "6. Alerts and emergency functions",
    paragraphs: [
      "The app can display alerts and associated incident images or clips when the connected service provides them. The SOS screens provide a manual emergency flow, but this version of RideGuard does not confirm that an SOS action has reached emergency contacts or emergency services. Do not rely on the app as your only way to seek help.",
    ],
  },
  {
    title: "7. Automatic SOS preferences",
    paragraphs: [
      "The automatic SOS control is currently unavailable because it is not connected to a preference service. Do not assume that a detected threat will automatically trigger an SOS message or contact anyone.",
    ],
  },
  {
    title: "8. MPIN and account security",
    paragraphs: [
      "MPIN screens are present, but MPIN setup and verification are not available in this version. Your account sign-in remains the active access method. Do not treat an unconfigured MPIN as protection for your account or incident data.",
    ],
  },
  {
    title: "9. Responsible use",
    paragraphs: [
      "Use RideGuard for authorized safety-related purposes. Do not use another person's account, misuse access to images or alerts, or use the app to harass or profile passengers. You remain responsible for deciding how to respond to an alert and for complying with applicable recording and privacy rules.",
    ],
  },
  {
    title: "10. Availability and technical limits",
    paragraphs: [
      "Monitoring and alert delivery can be interrupted by camera problems, permissions, battery limits, network loss, backend availability, or device configuration. Emergency features also depend on the services to which they are connected. RideGuard does not promise continuous or real-time protection.",
    ],
  },
  {
    title: "11. Changes to these terms",
    paragraphs: [
      "These terms may need to change as RideGuard's features and operations change. The current text will be available in the app. A formal process for notifying users of material changes has not yet been confirmed.",
    ],
  },
];

export function TermsScreen() {
  return <InformationPage title="Terms of Service" sections={sections} />;
}
