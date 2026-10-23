import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { Button } from "@/shared/ui/button";
import { useSosStore } from "../store/sos.store";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { submissionLabel, type Submission } from "../types";
import { styles } from "./sos-active-screen.styles";

function summary(label: string, value: Submission) {
  return label + ": " + submissionLabel[value.status] + (value.errorCode === "expired" ? " (request expired)" : "");
}

export function SosActiveScreen() {
  const router = useRouter();
  const state = useSosStore();
  useSosStatus(state.ready, true);
  const record = state.record;
  const title = state.phase === "submitting" ? "Requesting help" : state.phase === "checking" ? "Checking SOS status" :
    record?.status === "active" ? "SOS active" : record?.status === "ended" ? "SOS ended by you" : "SOS not confirmed";
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
    <Button title="Check SOS status" variant="secondary" isLoading={state.refreshing} disabled={state.phase === "submitting"}
      onPress={() => void state.refresh()} />
    {state.phase === "retry" && <Button title="Retry the same SOS request" variant="secondary" onPress={() => void state.retry()} />}
    {record && <>
      <Text style={[Typography.bodySmall, styles.description]}>{record.location
        ? "Phone location snapshot captured " + new Date(record.location.capturedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) + " (Asia/Manila). This is not live tracking."
        : "Location unavailable or sharing disabled."}</Text>
      {record.recipients.some((r) => r.initial.errorCode === "location_omitted_message_limit") &&
        <Text style={[Typography.bodySmall, styles.description]}>Location was omitted because the SMS length limit was reached.</Text>}
      {record.recipients.map((recipient) => <View key={recipient.contactId} style={{ gap: 6 }}>
        <Text style={[Typography.button, { color: BrandColors.secondary }]}>{recipient.name} · {recipient.phone}</Text>
        <Text accessibilityLiveRegion="polite" style={{ color: BrandColors.secondary }}>{summary("Initial SMS", recipient.initial)}</Text>
        {recipient.ended && <Text style={{ color: BrandColors.secondary }}>{summary("End update", recipient.ended)}</Text>}
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
