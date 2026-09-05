import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface PageLayoutProps {
  title: string;
  children: ReactNode;

  onBack?: () => void;

  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function PageLayout({
  title,
  children,
  onBack,
  scrollable = true,
  contentStyle,
}: PageLayoutProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    // custom
    if (onBack) {
      onBack();
      return;
    }

    // if theres a screen earlier
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // fall back to home
    router.replace("/");
  };

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, contentStyle]}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.content, styles.nonScrollableContent, contentStyle]}>
        {children}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        {/* BACK BUTTON */}
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>

        {/* PAGE TITLE */}
        <Text
          style={[
            Typography.bodyLarge,
            styles.title,
            {
              color: theme.text,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* SPACER */}
        <View style={styles.rightSpacer} />
      </View>

      {/* DIVIDER */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: theme.border,
          },
        ]}
      />

      {/* MAIN CONTENT */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  title: {
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },

  rightSpacer: {
    width: 40,
    height: 40,
  },

  divider: {
    height: 2,
    width: "100%",
  },

  content: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },

  nonScrollableContent: {
    flex: 1,
  },
});
