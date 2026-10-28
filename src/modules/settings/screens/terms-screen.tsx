import { InformationPage, type InformationSection } from "../components/information-page";

const sections: InformationSection[] = [
  {
    "title": "1. Introduction and Acceptance",
    "paragraphs": [
      "RideGuard is an AI-assisted threat detection and alert system designed to support the security of car-based Transport Network Vehicle Service (TNVS) drivers. These Terms explain how RideGuard works, how its cameras and AI-assisted features are used, and the limitations of the system. By using RideGuard, you agree to these Terms. Please read them carefully before using the app."
    ]
  },
  {
    "title": "2. What RideGuard Does",
    "paragraphs": [
      "RideGuard provides account access, connected-camera viewing, AI-assisted threat alerts, incident records, and emergency functions, including a manual SOS interface. Supported features depend on the connected devices, app permissions, and availability of the required services. RideGuard is designed to support driver security and is not intended to identify passengers or determine their intentions."
    ]
  },
  {
    "title": "3. Accounts and Your Information",
    "paragraphs": [
      "RideGuard uses account information to provide its services. Users may provide contact and vehicle details through available app features. You are responsible for keeping your account credentials and devices secure. Personal information must be collected and processed only for declared, legitimate purposes and in accordance with applicable requirements of Republic Act No. 10173, or the Data Privacy Act of 2012."
    ]
  },
  {
    "title": "4. Cameras and Authorized Use",
    "paragraphs": [
      "RideGuard uses two connected ESP32-CAM modules to capture visual data for AI-assisted threat detection. Where supported and initiated by the user, phone-camera monitoring may also be available. Connected cameras may provide a live view through the app.",
      "Camera images are transmitted to the system for analysis of visible weapon-like objects and movements that may indicate a possible threat to the driver. When the system's detection criteria are met, relevant images may be uploaded and linked to a threat event to support alert processing.",
      "Images may contain personal information if individuals can be identified. Camera use and the processing of personal information must follow the principles of transparency, legitimate purpose, and proportionality under Section 11 of the Data Privacy Act. Processing must also have an applicable lawful basis under Section 12. Users must follow applicable privacy, notice, and recording requirements when monitoring passengers."
    ]
  },
  {
    "title": "5. AI-Assisted Detection",
    "paragraphs": [
      "RideGuard uses AI-based object detection on individual images and movement analysis across sequences of frames to identify possible threats. The system may generate false alerts or fail to detect an actual threat. An alert does not confirm that an incident occurred or that a person intends harm. RideGuard does not guarantee threat detection, prevention, or the security of drivers or passengers.",
      "Visual data must be processed only for declared, legitimate purposes and limited to what is necessary for those purposes, consistent with the Data Privacy Act of 2012."
    ]
  },
  {
    "title": "6. Alerts and Emergency Functions",
    "paragraphs": [
      "RideGuard may display threat alerts, incident records, and associated images or clips when these are available through connected services. Such records must be accessed and handled only for authorized purposes and protected by appropriate security measures as required by Section 20 of the Data Privacy Act.",
      "The manual SOS interface allows users to initiate an emergency action. However, RideGuard does not guarantee that an SOS action will reach emergency contacts or emergency services. Do not rely on RideGuard as your only means of seeking emergency assistance."
    ]
  },
  {
    "title": "7. Automatic SOS Preferences",
    "paragraphs": [
      "The automatic SOS control is currently unavailable because it is not connected to a preference service. A detected threat must not be assumed to trigger an SOS message or contact anyone automatically."
    ]
  },
  {
    "title": "8. MPIN and Account Security",
    "paragraphs": [
      "MPIN screens are available in the app, but MPIN setup and verification are unavailable in the current version. Account sign-in remains the active access method. Do not assume that an MPIN protects your account or incident data until the feature is functional.",
      "RideGuard must apply appropriate organizational, physical, and technical safeguards to personal information as required by Section 20 of the Data Privacy Act. Security descriptions and commitments must reflect the measures actually implemented."
    ]
  },
  {
    "title": "9. Responsible Use",
    "paragraphs": [
      "Use RideGuard only for authorized driver-security purposes. Do not access another person's account without permission or misuse images, alerts, or incident records to harass, identify, or profile passengers. Users must handle recorded information responsibly and comply with applicable privacy and recording requirements.",
      "Under Section 16 of the Data Privacy Act, data subjects have rights relating to their personal information, subject to applicable legal conditions and limitations. RideGuard's Privacy Notice should explain these rights and how users and other affected individuals may exercise them."
    ]
  },
  {
    "title": "10. Availability and Technical Limits",
    "paragraphs": [
      "RideGuard's monitoring and alert functions may be interrupted by camera issues, device permissions, battery limitations, network problems, backend outages, or device configuration. Emergency functions also depend on the availability of connected services. RideGuard does not guarantee continuous monitoring, real-time alert delivery, or successful threat detection."
    ]
  },
  {
    "title": "11. Changes to These Terms",
    "paragraphs": [
      "RideGuard may update these Terms when its features, services, or data-processing practices change. The latest version will be made available in the app. Users will be notified of significant changes when appropriate. Changes affecting the processing of personal information must also be reflected in the applicable Privacy Notice."
    ]
  }
];

export function TermsScreen() {
  return <InformationPage title="Terms of Service" sections={sections} />;
}
