import { PageLayout } from "@/components/ui/page-layout";
import { FontFamily, Spacing, Typography } from "@/constants/theme";
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

interface SubsectionProps {
  title: string;
  children: ReactNode;
}

function Subsection({ title, children }: SubsectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.subsection}>
      <Text style={[Typography.bodySmall, styles.subsectionTitle, {}]}>
        {title}
      </Text>

      <View style={styles.subsectionContent}>{children}</View>
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <PageLayout title="Privacy Policy">
      <Section title="I. Overview">
        <Paragraph>
          This Privacy Policy explains what information RideGuard collects, why,
          how long it's kept, and what control you have over it. RideGuard is
          built around data minimization — we collect only what is needed for
          driver safety, and automatically delete what isn't needed.
        </Paragraph>
      </Section>

      <Section title="II. Information We Collect">
        <Subsection title="2.1 Account and Identity Information">
          <View style={styles.list}>
            <Bullet>Full name and phone number.</Bullet>
            <Bullet>Vehicle name and plate number.</Bullet>
          </View>
        </Subsection>

        <Subsection title="2.2 Hardware and Sensor Data">
          <View style={styles.list}>
            <Bullet>
              EM coil sensor readings (metal detection events, not identity of
              the object).
            </Bullet>
            <Bullet>Cabin camera footage.</Bullet>
            <Bullet>
              Face captures — only when a Tier 1, 2, or 3 incident is flagged,
              not continuously.
            </Bullet>
            <Bullet>
              Device pairing and hardware health status (battery, connection
              strength).
            </Bullet>
          </View>
        </Subsection>

        <Subsection title="2.3 Location Data">
          <View style={styles.list}>
            <Bullet>
              Live location while the app is in use, for incident tagging and
              emergency dispatch.
            </Bullet>
            <Bullet>
              Location shared with emergency contacts automatically only during
              a Tier 3 (attack detected) event, or manually if you trigger SOS.
            </Bullet>
          </View>
        </Subsection>

        <Subsection title="2.4 Emergency Contact Information">
          <View style={styles.list}>
            <Bullet>
              Names and phone numbers of contacts you choose to add.
            </Bullet>
          </View>
        </Subsection>

        <Subsection title="2.5 Usage and Diagnostic Data">
          <View style={styles.list}>
            <Bullet>
              App interaction logs, crash reports, and device information, used
              to maintain and improve the service.
            </Bullet>
          </View>
        </Subsection>
      </Section>

      <Section title="III. How We Use Your Information">
        <Paragraph>We use collected data solely to:</Paragraph>

        <View style={styles.list}>
          <Bullet>
            Detect potential threats during a ride (metal detection, behavior
            analysis).
          </Bullet>

          <Bullet>
            Alert you in real time and, where applicable, automatically notify
            emergency services or contacts.
          </Bullet>

          <Bullet>Verify your identity as a licensed driver.</Bullet>

          <Bullet>Maintain and improve system accuracy and reliability.</Bullet>

          <Bullet>Respond to support requests.</Bullet>
        </View>

        <Paragraph>
          We do not sell your data. We do not use ride footage or face captures
          for advertising, marketing, or any purpose unrelated to safety.
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

  subsection: {
    gap: 0,
    marginTop: Spacing.two,
  },

  subsectionTitle: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: FontFamily.geistSemiBold,
  },

  subsectionContent: {
    gap: Spacing.two,
  },
});
