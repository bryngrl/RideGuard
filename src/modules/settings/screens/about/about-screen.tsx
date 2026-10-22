import Constants from "expo-constants";
import { InformationPage, type InformationSection } from "../../components/information-page";

export function AboutScreen() {
  const sections: InformationSection[] = [
    {
      paragraphs: [
        "RideGuard is an AI-assisted driver-safety monitoring system designed for car-based Transport Network Vehicle Service (TNVS) drivers. It combines camera-based monitoring, threat detection, and emergency-response features to help drivers recognize and respond to potential safety risks.",
      ],
    },
    {
      title: "Developed by",
      lines: [
        "Aban, Marynelle",
        "Cortes, Angela Izy",
        "Esquerra, Jovilyn F.",
        "Gerolia, Bryan James",
      ],
    },
  ];

  if (Constants.expoConfig?.version) {
    sections.push({ title: "App version", lines: [Constants.expoConfig.version] });
  }

  return <InformationPage title="About" sections={sections} />;
}
