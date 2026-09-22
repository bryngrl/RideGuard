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
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface PageLayoutProps {
  title: string;
  children: ReactNode;

  onBack?: () => void;

  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  contentFlush?: boolean;

  footer?: ReactNode;
  footerStyle?: StyleProp<ViewStyle>;

  showBackButton?: boolean;
  backgroundColor?: string;

  dividerColor?: string;
  headerTextColor?: string;

  rightAction?: ReactNode;
}

export function PageLayout({
  title,
  children,
  onBack,
  scrollable = true,
  contentStyle,
  contentFlush = false,
  footer,
  footerStyle,
  showBackButton = true,
  backgroundColor,
  dividerColor,
  headerTextColor,
  rightAction,
}: PageLayoutProps) {
  const theme = useTheme();
  const router = useRouter();

  const pageBackgroundColor =
    backgroundColor ?? theme.background;

  const pageDividerColor =
    dividerColor ?? theme.border;

  const pageHeaderTextColor =
    headerTextColor ?? theme.text;

  const handleBack = () => {
    // Use custom back behavior if provided
    if (onBack) {
      onBack();
      return;
    }

    // Go back if navigation history exists
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Fallback route
    router.replace("/");
  };

  const renderContent = () => {
    const contentStyles = [
      styles.content,
      contentFlush && styles.flushContent,
      contentStyle,
    ];

    if (scrollable) {
      return (
        <ScrollView
          style={[
            styles.flex,
            {
              backgroundColor: pageBackgroundColor,
            },
          ]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyles}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View
        style={[
          contentStyles,
          styles.nonScrollableContent,
          {
            backgroundColor: pageBackgroundColor,
          },
        ]}
      >
        {children}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: pageBackgroundColor,
        },
      ]}
      edges={["top"]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: pageBackgroundColor,
          },
        ]}
      >
        {/* BACK BUTTON */}
        {showBackButton ? (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={pageHeaderTextColor}
            />
          </Pressable>
        ) : (
          <View style={styles.rightSpacer} />
        )}

        {/* PAGE TITLE */}
        <Text
          style={[
            Typography.bodyLarge,
            styles.title,
            {
              color: pageHeaderTextColor,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* RIGHT ACTION */}
        <View style={styles.rightAction}>
          {rightAction}
        </View>
      </View>

      {/* DIVIDER */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: pageDividerColor,
          },
        ]}
      />

      {/* MAIN CONTENT */}
      {renderContent()}

      {/* OPTIONAL FOOTER */}
      {footer && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: pageBackgroundColor,
            },
            footerStyle,
          ]}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  flex: {
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
  flushContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  nonScrollableContent: {
    flex: 1,
  },

  footer: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },

  rightAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});