import { PageLayout } from "@/components/ui/page-layout";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[Typography.h4, styles.sectionTitle, { fontSize: 14 }]}>
        {title}
      </Text>

      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <Text
      style={[
        Typography.bodySmall,
        styles.paragraph,
        {
          marginTop: Spacing.one,
        },
      ]}
    >
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.bulletRow}>
      <Text
        style={[
          Typography.bodySmall,
          styles.bullet,
          {
            marginLeft: Spacing.two,
          },
        ]}
      >
        •
      </Text>

      <Text
        style={[Typography.bodySmall, styles.bulletText, { lineHeight: 16 }]}
      >
        {children}
      </Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <PageLayout title="Terms of Service">
      <Section title="I. Acceptance of Terms">
        <Paragraph>
          By creating an account or using Rideguard, you agree to be bound by
          these Terms of Service and our Privacy Policy. If you do not agree, do
          not use the app or hardware.
        </Paragraph>
      </Section>

      <Section title="II. Description of Service">
        <Paragraph>
          Rideguard is a driver-safety system consisting of:
        </Paragraph>

        <View style={styles.list}>
          <Bullet>A mobile application.</Bullet>

          <Bullet>
            An EM coil (metal) detection sensor installed in the vehicle door.
          </Bullet>

          <Bullet>
            A cabin-facing camera for passenger movement and behavior
            monitoring.
          </Bullet>
        </View>

        <Paragraph>
          The system is designed to detect metal objects, flag unusual passenger
          movement, and respond automatically if a physical attack on the driver
          is detected. Rideguard is a safety aid intended to reduce risk and
          support faster emergency response — it is not a guarantee of
          protection and cannot prevent all incidents.
        </Paragraph>
      </Section>

      <Section title="III. Eligibility">
        <Paragraph>You must be:</Paragraph>

        <View style={styles.list}>
          <Bullet>A licensed driver in good standing.</Bullet>
          <Bullet>At least 18 years of age.</Bullet>
          <Bullet>
            The registered owner or authorized operator of the vehicle in which
            Rideguard hardware is installed.
          </Bullet>
        </View>
      </Section>

      <Section title="IV. Account Registration">
        <Paragraph>
          You agree to provide accurate, current information during onboarding,
          including your name, contact details, driver's license, and vehicle
          information. You are responsible for keeping your account credentials
          secure.
        </Paragraph>
      </Section>

      <Section title="V. Hardware Requirements and Driver Responsibilities">
        <Paragraph>
          You agree to provide accurate, current information during onboarding,
          including your name, contact details, driver's license, and vehicle
          information. You are responsible for keeping your account credentials
          secure.
        </Paragraph>
      </Section>

      <Section title="VI. Automated Alerts and Emergency Response">
        <Bullet>
          Tier 1 (metal detected): Informational only. No automatic action is
          taken.
        </Bullet>

        <Bullet>
          Tier 2 (metal detected + suspicious movement): An elevated alert is
          sent to you. Depending on your settings, your emergency contact may be
          notified automatically or only after your confirmation.
        </Bullet>

        <Bullet>
          Tier 3 (attack detected): RideGuard automatically dials emergency
          services and notifies your emergency contacts with your live location.
          This occurs without requiring driver confirmation, since you may be
          incapacitated.
        </Bullet>

        <Paragraph>
          You acknowledge that automated detection systems, including
          camera-based behavior analysis, may produce false positives or false
          negatives, and that RideGuard is not liable for outcomes resulting
          from detection errors, to the extent permitted by law.
        </Paragraph>
      </Section>

      <Section title="VII. Footage, Data, and Evidence">
        <Bullet>
          Footage from rides with no flagged incident is automatically deleted
          according to your selected retention window (24–72 hours).
        </Bullet>

        <Bullet>
          Footage and face captures tied to a flagged or reported incident are
          retained and locked to preserve evidence and cannot be deleted by the
          driver.
        </Bullet>

        <Bullet>
          You may not use Rideguard footage for purposes unrelated to your own
          safety, including sharing passenger footage publicly, without
          appropriate legal basis.
        </Bullet>
      </Section>

      <Section title="VIII. Passenger Notice">
        <Paragraph>
          Where required by local law, you are responsible for ensuring
          appropriate notice is given to passengers that recording and detection
          technology is in use in the vehicle.
        </Paragraph>
      </Section>

      <Section title="IX. Prohibited Use">
        <Paragraph>You agree not to:</Paragraph>

        <View style={styles.list}>
          <Bullet>
            Use Rideguard to harass, discriminate against, or profile
            passengers.
          </Bullet>

          <Bullet>Disable safety features to conceal misconduct.</Bullet>

          <Bullet>Attempt to access another driver's account or data.</Bullet>

          <Bullet>
            Reverse-engineer or tamper with the detection hardware or software.
          </Bullet>
        </View>
      </Section>

      <Section title="X. Service Availability">
        <Paragraph>
          Rideguard relies on hardware connectivity (Bluetooth), mobile network
          access, and location services. Service interruptions (e.g., loss of
          signal, hardware disconnection, low battery) may affect detection and
          alert delivery. Rideguard is not liable for gaps in protection caused
          by factors outside its control.
        </Paragraph>
      </Section>

      <Section title="XI. Limitation of Liability">
        <Paragraph>
          To the maximum extent permitted by law, Rideguard and its developers
          are not liable for indirect, incidental, or consequential damages
          arising from use of, or inability to use, the app or hardware,
          including but not limited to failure to detect a threat or delay in
          emergency response.
        </Paragraph>
      </Section>

      <Section title="XII. Termination">
        <Paragraph>
          Rideguard may suspend or terminate accounts that violate these terms.
          You may stop using the service and request account deletion at any
          time through the app.
        </Paragraph>
      </Section>

      <Section title="XIII. Changes to These Terms">
        <Paragraph>
          We may update these Terms from time to time. Continued use of
          Rideguard after changes take effect constitutes acceptance of the
          revised terms.
        </Paragraph>
      </Section>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.four,
  },

  sectionTitle: {
    marginBottom: Spacing.two,
  },

  sectionContent: {
    gap: Spacing.one,
  },

  paragraph: {
    marginBottom: Spacing.half,
  },

  list: {
    gap: 0,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  bullet: {
    width: Spacing.two,
  },

  bulletText: {
    flex: 1,
  },
});
