import { BrandedAlert as Alert } from "@/shared/lib/branded-alert";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import SosIcon from "@/assets/icons/home/echo-sos.svg";
import ContactIcon from "@/assets/icons/home/filled-contact.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, BrandColors, Spacing, Typography } from "@/shared/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { sosStore } from "@/modules/sos/store/sos.store";
import { resolveSosEntry } from "@/modules/sos/store/sos-entry";

export function QuickActions({ homeLayout = false }: { homeLayout?: boolean }) {
  const router = useRouter();
  const colors = useTheme();
  const [checkingSos, setCheckingSos] = useState(false);
  const opening = useRef(false);
  const focused = useRef(false);
  const visit = useRef(0);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    visit.current++;
    setCheckingSos(opening.current);
    return () => { focused.current = false; visit.current++; };
  }, []));
  const openSos = async () => {
    if (opening.current) return;
    opening.current = true;
    setCheckingSos(true);
    const owner = useAuthStore.getState().user?.uid ?? null;
    const currentVisit = visit.current;
    try {
      sosStore.getState().setForeground(AppState.currentState === "active");
      const route = await resolveSosEntry(sosStore, owner);
      if (!focused.current || visit.current !== currentVisit || (useAuthStore.getState().user?.uid ?? null) !== owner || !route) return;
      if (route === "/sos") router.push({ pathname: "/sos", params: { statusChecked: "true" } });
      else router.push(route);
    } catch (error) {
      if (focused.current && visit.current === currentVisit && (useAuthStore.getState().user?.uid ?? null) === owner)
        Alert.alert("Could not open SOS", error instanceof Error ? error.message : "Could not check SOS status. Try again.");
    } finally {
      opening.current = false;
      if (focused.current) setCheckingSos(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.actions}>
        <Pressable
          feedbackRadius={BorderRadius.full}
          feedbackColor={BrandColors.secondary}
          style={[
            styles.sosButton,
            homeLayout && styles.homeSosButton,
          ]}
          onPress={() => void openSos()}
          disabled={checkingSos}
          accessibilityState={{ busy: checkingSos, disabled: checkingSos }}
          accessibilityRole="button"
          accessibilityLabel="Open SOS emergency screen"
        >
          {checkingSos ? <ActivityIndicator color={BrandColors.secondary} /> :
            <SosIcon width={homeLayout ? 22 : 15} height={homeLayout ? 22 : 15} />}
          <Text accessibilityLiveRegion="polite" style={[Typography.button, styles.sosButtonText]}>{checkingSos ? "Checking SOS status…" : "SOS"}</Text>
        </Pressable>
        {!homeLayout && (
          <Pressable
            feedbackRadius={BorderRadius.full}
            style={[styles.contactsButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/contact" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open emergency contacts"
          >
            <ContactIcon color={colors.icon} width={13} height={16} />
            <Text style={[Typography.button, { color: colors.primary }]}>Contacts</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  actions: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: Spacing.two,
  },
  contactsButton: {
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  sosButton: {
    alignItems: "center",
    backgroundColor: BrandColors.error,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  homeSosButton: {
    minHeight: 56,
    width: "100%",
    gap: Spacing.two,
  },
  sosButtonText: {
    color: BrandColors.secondary,
  },
});
