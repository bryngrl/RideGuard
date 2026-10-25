import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BrandColors, Typography } from "@/shared/theme";
import { useTheme } from "@/shared/hooks";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { Button } from "@/shared/ui/button";
import { useSosStore } from "../store/sos.store";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { ageLabel, hasPending, messagePresentation, type Submission } from "../types";
import { styles } from "./sos-active-screen.styles";

function MessageRow({ label, value, now, color }: { label: string; value: Submission; now: number; color: string }) {
  const presentation = messagePresentation(value, now);
  return <View style={{ gap: 4 }}>
    <Text style={[Typography.bodySmall, { color }]}>{label}</Text>
    <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${label}: ${presentation.label}. ${presentation.detail}`}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={presentation.icon} size={22} color={color} accessible={false} />
      <Text style={[Typography.button, { color, flexShrink: 1 }]}>{presentation.label}</Text>
    </View>
    <Text style={[Typography.bodySmall, { color }]}>{presentation.detail}</Text>
    <Text style={[Typography.bodySmall, { color }]}>{value.delivery?.lastCheckedAt
      ? `Delivery checked ${ageLabel(value.delivery.lastCheckedAt, now)}` : "Not checked yet"}</Text>
  </View>;
}

export function SosActiveScreen() {
  const router = useRouter();
  const state = useSosStore();
  useSosStatus(state.ready, true);
  const record = state.record;
  const colors = useTheme();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const title = record?.status === "active" ? "SOS active" : record?.status === "ended" ? "SOS ended by you" :
    state.phase === "submitting" ? "Requesting help" : state.phase === "checking" ? "Checking SOS status" : "SOS not confirmed";
  const cooldown = record?.statusRefresh?.nextAllowedAt ? Date.parse(record.statusRefresh.nextAllowedAt) - now : 0;
  const refreshing = state.refreshing || record?.statusRefresh?.state === "pending" && Date.parse(record.statusRefresh.expiresAt ?? "") > now;
  const close = async () => { await state.dismissEnded(); router.replace("/sos"); };
  return <PageLayout title="SOS" backgroundColor={BrandColors.error} headerTextColor={BrandColors.secondary}
    contentStyle={[styles.content, { gap: 20 }]} footerStyle={styles.footer}
    footer={record?.status === "active" ? <View style={{ gap: 12 }}>
      <SlideButton key={state.stopping ? "stopping" : "ready"} label={state.stopping ? "Stopping SOS" : "Slide to stop SOS"}
        disabled={state.stopping} onComplete={() => void state.stop()} trackColor="#FFE1E3" borderColor="#FFE1E3"
        thumbColor={BrandColors.error} labelColor={BrandColors.error} arrowColor={BrandColors.secondary} />
      <Button title="Stop SOS" variant="secondary" isLoading={state.stopping} onPress={() => void state.stop()} />
    </View> : undefined}>
    <Text accessibilityLiveRegion="polite" style={[Typography.largeTitle, styles.title]}>{title}</Text>
    <Text style={[Typography.body, styles.description]}>
      {record?.status === "active" ? "An active SOS does not mean every message was submitted successfully." :
        record?.status === "ended" ? "Already-submitted SMS cannot be recalled. End-update results are shown below." :
          "Do not assume contacts were notified. You can contact them directly while checking status."}
    </Text>
    {state.error && <Text accessibilityLiveRegion="polite" style={[Typography.body, styles.description]}>{state.error}</Text>}
    {state.error && <Button title="Retry status" variant="secondary" isLoading={state.refreshing} onPress={() => void state.refreshStatus()} />}
    {state.notice && <Text style={[Typography.bodySmall, styles.description]}>{state.notice}</Text>}
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Text style={[Typography.bodySmall, styles.description, { flex: 1 }]}>{state.lastFetchedAt ? `Updated ${ageLabel(state.lastFetchedAt, now)}` : "Status not loaded yet"}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh message status" disabled={!!refreshing || cooldown > 0 || state.phase === "submitting"}
        onPress={() => void state.refreshStatus()} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="refresh" size={20} color={BrandColors.secondary} />
      </Pressable>
    </View>
    <Text style={[Typography.bodySmall, styles.description]}>{refreshing ? "Checking message status…" : cooldown > 0
      ? `Refresh available in ${Math.ceil(cooldown / 1000)} seconds` : hasPending(record, now) ? "Status updates automatically" : "Latest known message results"}</Text>
    {state.phase === "retry" && <Button title="Retry the same SOS request" variant="secondary" onPress={() => void state.retry()} />}
    {record && <>
      <Text style={[Typography.bodySmall, styles.description]}>{record.location
        ? "Phone location snapshot captured " + new Date(record.location.capturedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) + " (Asia/Manila). This is not live tracking."
        : "Location unavailable or sharing disabled."}</Text>
      {record.recipients.some((r) => r.initial.errorCode === "location_omitted_message_limit") &&
        <Text style={[Typography.bodySmall, styles.description]}>Location was omitted because the SMS length limit was reached.</Text>}
      {record.recipients.map((recipient) => <View key={recipient.contactId} style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
        <Text style={[Typography.button, { color: colors.text }]}>{recipient.name} · {recipient.phone}</Text>
        <MessageRow label="SOS message" value={recipient.initial} now={now} color={colors.text} />
        {recipient.ended && <MessageRow label="SOS ended message" value={recipient.ended} now={now} color={colors.text} />}
      </View>)}
      {record.recipients.some((r) => r.initial.status === "unknown" || r.ended?.status === "unknown") &&
        <Text style={[Typography.bodySmall, styles.description]}>An unknown submission may have reached the contact. It will not be resent automatically.</Text>}
    </>}
    {!record && <View style={{ gap: 8 }}><Text style={[Typography.button, { color: BrandColors.secondary }]}>Contact someone directly</Text>
      {state.contactsStatus === "error" && <Button title="Retry loading contact numbers" variant="secondary" onPress={() => void state.loadContacts()} />}
      {state.contacts.map((contact) => <Text key={contact.id} selectable style={{ color: BrandColors.secondary }}>{contact.name} · {contact.phoneNumber}</Text>)}
    </View>}
    {record?.status === "ended" && <Button title="Back to SOS" variant="secondary" onPress={() => void close()} />}
    {!record && state.phase === "idle" && <Button title="Back to SOS" variant="secondary" onPress={() => router.replace("/sos")} />}
  </PageLayout>;
}
