import { useTheme } from "@/shared/hooks/use-theme";
import { FontFamily, Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsPageLayout } from "./settings-page-layout";

export interface InformationSection {
  title?: string;
  paragraphs?: string[];
  lines?: string[];
}

export function InformationPage({ title, sections }: { title: string; sections: InformationSection[] }) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();

  return (
    <SettingsPageLayout
      title={title}
      contentStyle={{ paddingTop: Spacing.four, paddingBottom: Spacing.four + bottom }}
    >
      {sections.map((section, sectionIndex) => (
        <View key={section.title ?? sectionIndex} style={styles.section}>
          {section.title && (
            <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
              {section.title}
            </Text>
          )}
          {section.paragraphs?.map((paragraph, index) => (
            <Text
              key={index}
              style={[
                Typography.body,
                styles.paragraph,
                { color: colors.text, textAlign: width >= 360 && paragraph.length >= 100 ? "justify" : "left" },
              ]}
            >
              {paragraph}
            </Text>
          ))}
          {section.lines?.map((line) => (
            <Text key={line} style={[Typography.body, styles.line, { color: colors.text }]}>
              {line}
            </Text>
          ))}
        </View>
      ))}
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, marginBottom: Spacing.four },
  heading: { fontSize: 16, lineHeight: 22, fontFamily: FontFamily.geistMedium, textAlign: "left" },
  paragraph: { lineHeight: 22 },
  line: { lineHeight: 22, textAlign: "left" },
});
