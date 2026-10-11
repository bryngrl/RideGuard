import MainLogo from "@/assets/icons/logos/main.svg";
import { useOnboardingStore } from "@/modules/onboarding";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "@/shared/lib/phone-utils";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import {
  ConfirmationModal,
  CustomTextInput,
  KeyboardAvoidingWrapper,
} from "@/shared/ui";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView as ContextSafeAreaView } from "react-native-safe-area-context";
import {
  Header,
  RadioOption,
  ToggleRow,
} from "../components/settings-controls";
import { SETTINGS_SECTIONS } from "../constants";
import { useSettingsStore } from "../store/settings.store";

export function SearchSettingsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const history = useSettingsStore((s) => s.searchHistory);
  const addHistory = useSettingsStore((s) => s.addSearchHistory);
  const clearHistory = useSettingsStore((s) => s.clearSearchHistory);
  const [query, setQuery] = useState("");
  const inputRef = useRef<import("react-native").TextInput>(null);
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);
  const rows = useMemo(
    () =>
      SETTINGS_SECTIONS.flatMap((section) =>
        section.rows.map((row) => ({ ...row, section: section.title })),
      ),
    [],
  );
  const results = rows.filter((row) =>
    `${row.title} ${row.section}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  const open = (title: string, route: string) => {
    addHistory(title);
    router.push(route as never);
  };
  return (
    <ContextSafeAreaView
      edges={["top"]}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingWrapper
        safeAreaEdges={["bottom"]}
        contentContainerStyle={styles.searchContent}
      >
        <CustomTextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          // LeftIcon
          // leftIcon={<Text style={{ color: colors.textMuted }}>⌕</Text>}
          inputWrapperStyle={{
            backgroundColor: colors.backgroundSelected,
            borderWidth: 0,
          }}
        />
        {query.trim() ? (
          <View>
            {results.map((row) => (
              <Pressable
                key={row.title}
                onPress={() => open(row.title, row.route)}
                style={styles.searchResult}
              >
                <Text style={[Typography.body, { color: colors.text }]}>
                  {row.title}
                </Text>
                <Text
                  style={[Typography.bodySmall, { color: colors.textMuted }]}
                >
                  {row.section}
                </Text>
              </Pressable>
            ))}
            {results.length === 0 && (
              <Text style={[Typography.body, { color: colors.textMuted }]}>
                No settings found.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.history}>
            <Text style={[Typography.body, { color: colors.text }]}>
              Search history
            </Text>
            {history.map((item) => {
              const row = rows.find((candidate) => candidate.title === item);
              return (
                <Pressable
                  key={item}
                  onPress={() => row && open(row.title, row.route)}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.backgroundSelected },
                  ]}
                >
                  <Text style={[Typography.bodySmall, { color: colors.text }]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.clearHistory}>
              <Pressable onPress={clearHistory}>
                <Text
                  style={[
                    Typography.button,
                    styles.clear,
                    { color: colors.primary },
                  ]}
                >
                  Clear all
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingWrapper>
    </ContextSafeAreaView>
  );
}

function SettingsPage({
  title,
  children = null,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const colors = useTheme();
  return (
    <ContextSafeAreaView
      edges={["top"]}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      <Header title={title} onBack={() => router.back()} />
      <KeyboardAvoidingWrapper
        safeAreaEdges={["bottom"]}
        contentContainerStyle={styles.pageContent}
      >
        {children}
      </KeyboardAvoidingWrapper>
    </ContextSafeAreaView>
  );
}

export function RetentionScreen() {
  const colors = useTheme();
  const value = useSettingsStore((s) => s.retention);
  const setValue = useSettingsStore((s) => s.setRetention);
  return (
    <SettingsPage title="Data and footage retention">
      <Text
        style={[
          Typography.h3,
          { paddingTop: Spacing.four, paddingBottom: Spacing.one },
        ]}
      >
        Automatic Deletion
      </Text>
      <Text
        style={[
          Typography.bodySmall,
          styles.description,
          { color: colors.textMuted },
        ]}
      >
        Select how long unflagged trip recordings and system logs are stored
        before being permanently deleted.
      </Text>
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {(
          [
            [24, "Recommended for privacy"],
            [48, "Default"],
            [72, ""],
          ] as const
        ).map(([hours, subtitle]) => (
          <RadioOption
            key={hours}
            title={`${hours} hours`}
            subtitle={subtitle}
            selected={value === hours}
            onPress={() => setValue(hours)}
          />
        ))}
      </View>
      <View
        style={[styles.note, { backgroundColor: colors.backgroundSelected }]}
      >
        <Text style={[Typography.h4, { color: colors.text }]}>
          ⓘ Flagged incidents
        </Text>
        <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
          Flagged footage and system logs are saved until the incident has been
          reviewed.
        </Text>
      </View>
    </SettingsPage>
  );
}

export function NotificationsScreen() {
  const s = useSettingsStore();
  return (
    <SettingsPage title="Notifications">
      <Text style={styles.sectionLabel}>Flags</Text>
      <View style={styles.panel}>
        <ToggleRow
          title="Alerts"
          value={s.alertsEnabled}
          onValueChange={s.setAlertsEnabled}
        />
        <ToggleRow
          title="Attack detected"
          description="Always on"
          value
          onValueChange={() => undefined}
          disabled
        />
      </View>
      <Text style={styles.sectionLabel}>Delivery</Text>
      <View style={styles.panel}>
        <ToggleRow
          title="Push notification"
          value={s.pushEnabled}
          onValueChange={s.setPushEnabled}
        />
        <ToggleRow
          title="Sound"
          value={s.soundEnabled}
          onValueChange={s.setSoundEnabled}
        />
        <ToggleRow
          title="Vibration"
          value={s.vibrationEnabled}
          onValueChange={s.setVibrationEnabled}
        />
      </View>
    </SettingsPage>
  );
}

export function LocationScreen() {
  const s = useSettingsStore();
  return (
    <SettingsPage title="Location sharing">
      <ToggleRow
        title="Location sharing"
        description="Share your location with emergency contacts during an incident."
        value={s.locationSharing}
        onValueChange={s.setLocationSharing}
      />
    </SettingsPage>
  );
}

export function DisplayScreen() {
  const colors = useTheme();
  const preference = useSettingsStore((s) => s.themePreference);
  const setPreference = useSettingsStore((s) => s.setThemePreference);
  const system = preference === "system";
  return (
    <SettingsPage title="Display">
      <Text
        style={[
          Typography.h3,
          { color: colors.text, marginBottom: Spacing.three },
        ]}
      >
        Appearance
      </Text>
      <View style={styles.previews}>
        {(["light", "dark"] as const).map((mode) => (
          <Pressable
            key={mode}
            disabled={system}
            onPress={() => setPreference(mode)}
            style={[
              styles.preview,
              {
                backgroundColor: mode === "light" ? "#FFFFFF" : "#152037",
                borderColor:
                  preference === mode ? colors.primary : colors.border,
                opacity: system ? 0.5 : 1,
              },
            ]}
          >
            <MainLogo width={28} height={28} />
            <View style={{ gap: 5, marginTop: 12 }}>
              <View
                style={{
                  width: 60,
                  height: 5,
                  backgroundColor: mode === "light" ? "#1A2B4C" : "#60A5FA",
                }}
              />
              <View
                style={{
                  width: 42,
                  height: 5,
                  backgroundColor: mode === "light" ? "#DCE8FF" : "#2A3A5E",
                }}
              />
            </View>
            <Text
              style={{
                color: mode === "light" ? "#1A2B4C" : "#FFFFFF",
                marginTop: 10,
              }}
            >
              {mode === "light" ? "Light" : "Dark"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.radioLine}>
        <RadioOption
          title="Light"
          selected={preference === "light"}
          onPress={() => setPreference("light")}
        />
        <RadioOption
          title="Dark"
          selected={preference === "dark"}
          onPress={() => setPreference("dark")}
        />
      </View>
      <ToggleRow
        title="Use device settings"
        description="Match appearance to your device's display"
        value={system}
        onValueChange={(value) => setPreference(value ? "system" : "light")}
      />
    </SettingsPage>
  );
}

export function EmptySettingsScreen({ title }: { title: string }) {
  return <SettingsPage title={title} />;
}

export function AccountScreen() {
  const router = useRouter();
  const colors = useTheme();
  const data = useOnboardingStore();
  const [flipped, setFlipped] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;
  const name = `${data.firstName} ${data.lastName}`.trim() || "Your profile";
  const flip = () => {
    Animated.timing(rotate, {
      toValue: flipped ? 0 : 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };
  return (
    <ContextSafeAreaView
      edges={["top"]}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      <Header
        title="Account"
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => router.push("/settings/account/edit" as never)}
          >
            <Text style={[Typography.button, { color: colors.primary }]}>
              Edit
            </Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingWrapper
        safeAreaEdges={["bottom"]}
        contentContainerStyle={styles.accountContent}
      >
        <Pressable onPress={flip} style={styles.accountWrap}>
          <Animated.View
            style={[
              styles.accountCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                transform: [
                  {
                    rotateY: rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "180deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[Typography.h2, { color: colors.textInverse }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[Typography.h2, { color: colors.text }]}>{name}</Text>
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {data.phone
                ? `+63 ${normalizePhoneNumber(data.phone)}`
                : "No phone number"}
            </Text>
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {data.firstName ? "RideGuard account" : "Complete your profile"}
            </Text>
            <MainLogo width={24} height={24} />
          </Animated.View>
          <Animated.View
            style={[
              styles.accountCard,
              styles.backCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                transform: [
                  {
                    rotateY: rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["180deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[Typography.h3, { color: colors.text }]}>Vehicle</Text>
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {[data.vehicleBrand, data.vehicleModel]
                .filter(Boolean)
                .join(" ") || "No vehicle"}
            </Text>
            <Text
              style={[
                Typography.h3,
                { color: colors.text, marginTop: Spacing.four },
              ]}
            >
              Plate number
            </Text>
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {data.plateNumber || "No plate number"}
            </Text>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingWrapper>
    </ContextSafeAreaView>
  );
}

export function AccountEditScreen() {
  const router = useRouter();
  const colors = useTheme();
  const data = useOnboardingStore();
  const update = useOnboardingStore((s) => s.updateDraft);
  const [form, setForm] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: normalizePhoneNumber(data.phone),
    vehicleBrand: data.vehicleBrand,
    vehicleModel: data.vehicleModel,
    plateNumber: data.plateNumber,
  });
  const [confirm, setConfirm] = useState(false);
  const initial = `${data.firstName}|${data.lastName}|${normalizePhoneNumber(data.phone)}|${data.vehicleBrand}|${data.vehicleModel}|${data.plateNumber}`;
  const changed =
    `${form.firstName}|${form.lastName}|${form.phone}|${form.vehicleBrand}|${form.vehicleModel}|${form.plateNumber}` !==
    initial;
  const valid = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone &&
    isValidPhoneNumber(form.phone),
  );
  const set = (key: keyof typeof form, value: string) =>
    setForm((state) => ({ ...state, [key]: value }));
  const cancel = () => (changed ? setConfirm(true) : router.back());
  const save = () => {
    if (!changed || !valid) return;
    update({ ...form, phone: normalizePhoneNumber(form.phone) });
    router.back();
  };
  return (
    <ContextSafeAreaView
      edges={["top"]}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      <Header title="Account" onBack={cancel} />
      <KeyboardAvoidingWrapper
        safeAreaEdges={["bottom"]}
        contentContainerStyle={styles.editContent}
      >
        <View style={styles.editTop}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[Typography.h2, { color: colors.textInverse }]}>
              {form.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[Typography.h3, { color: colors.text }]}>
            {`${form.firstName} ${form.lastName}`.trim()}
          </Text>
        </View>
        <CustomTextInput
          label="Full name"
          value={`${form.firstName} ${form.lastName}`.trim()}
          onChangeText={(value) => {
            const parts = value.split(" ");
            set("firstName", parts.shift() || "");
            set("lastName", parts.join(" "));
          }}
        />
        <CustomTextInput
          label="Phone number"
          required
          prefix="+63"
          keyboardType="number-pad"
          maxLength={10}
          value={form.phone}
          onChangeText={(value) =>
            set("phone", value.replace(/\D/g, "").replace(/^0+/, ""))
          }
          error={
            form.phone && !isValidPhoneNumber(form.phone)
              ? "Enter a valid 10-digit Philippine mobile number."
              : undefined
          }
        />
        <CustomTextInput
          label="Email"
          value="Managed by your sign-in provider"
          editable={false}
        />
        <CustomTextInput
          label="Vehicle"
          value={form.vehicleBrand}
          onChangeText={(value) => set("vehicleBrand", value)}
        />
        <CustomTextInput
          label="Plate number"
          value={form.plateNumber}
          onChangeText={(value) => set("plateNumber", value)}
        />
        <View style={styles.editButtons}>
          <Pressable
            onPress={cancel}
            style={[styles.outlineButton, { borderColor: colors.primary }]}
          >
            <Text style={[Typography.button, { color: colors.primary }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            disabled={!changed || !valid}
            onPress={save}
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  changed && valid ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[Typography.button, { color: colors.textInverse }]}>
              Save
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingWrapper>
      <ConfirmationModal
        visible={confirm}
        title="Discard changes?"
        description="Your edits will be lost."
        primaryButtonText="Discard"
        secondaryButtonText="Keep editing"
        primaryButtonColor={colors.error}
        onPrimaryPress={() => {
          setConfirm(false);
          router.back();
        }}
        onSecondaryPress={() => setConfirm(false)}
      />
    </ContextSafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContent: {},
  searchResult: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D9D9D9",
  },
  history: {
    alignItems: "flex-start",
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  clearHistory: {
    alignItems: "center",
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.full,
    alignSelf: "stretch",
  },
  clear: { marginTop: Spacing.four },
  page: { flex: 1 },
  pageContent: { paddingTop: 0 },
  description: { marginBottom: Spacing.four },
  panel: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
  },
  note: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
  },
  sectionLabel: {
    ...Typography.caption,
    color: "#9C9C9C",
    marginBottom: Spacing.two,
    textTransform: "uppercase",
  },
  previews: { flexDirection: "row", gap: Spacing.three },
  preview: {
    flex: 1,
    minHeight: 145,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
  },
  radioLine: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: Spacing.three,
  },
  accountWrap: { margin: Spacing.four, minHeight: 250 },
  accountContent: { paddingTop: 0 },
  accountCard: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.four,
    backfaceVisibility: "hidden",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  backCard: { justifyContent: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  editContent: { paddingTop: 0 },
  editTop: {
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  editButtons: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  outlineButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
