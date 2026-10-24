import SosActiveIcon from "@/assets/icons/actions/sos-activated.svg";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { Button } from "@/shared/ui/button";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSosStatus } from "../hooks/use-sos-lifecycle";
import { useSosStore } from "../store/sos.store";
import { submissionLabel, type Submission } from "../types";
import { styles } from "./sos-active-screen.styles";

function summary(label: string, value: Submission) {
  return label + ": " + submissionLabel[value.status] + (value.errorCode === "expired" ? " (request expired)" : "");
}

export function SosActiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useSosStore();
  useSosStatus(state.ready, true);
  const record = state.record;
  const active = record?.status === "active";
  const title = state.phase === "submitting" ? "Requesting help" : state.phase === "checking" ? "Checking SOS status" :
    active ? "Slide to stop" : record?.status === "ended" ? "SOS ended by you" : "SOS not confirmed";
  const description = active ? "An active SOS does not mean every message was submitted successfully." :
    record?.status === "ended" ? "Already-submitted SMS cannot be recalled. End-update results are shown below." :
      "Do not assume contacts were notified. You can contact them directly while checking status.";
  const close = async () => {
    await state.dismissEnded();
    router.replace("/sos");
  };

  return (
    <>
      <StatusBar style="light" />
      <PageLayout
        title="SOS"
        showBackButton={false}
        backgroundColor={BrandColors.error}
        dividerColor="rgba(255, 255, 255, 0.35)"
        headerTextColor={BrandColors.secondary}
        contentStyle={styles.content}
        footerStyle={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        footer={active ?
          <SlideButton
            key={state.stopping ? "stopping" : "ready"}
            label={state.stopping ? "Stopping SOS" : "Slide to stop SOS"}
            disabled={state.stopping}
            onComplete={() => void state.stop()}
            trackColor="#FFE1E3"
            borderColor="#FFE1E3"
            thumbColor={BrandColors.error}
            labelColor={BrandColors.error}
            arrowColor={BrandColors.secondary}
          />
          : undefined}
      >
        <View style={styles.container}>
          <View style={styles.messageSection}>
            <Text accessibilityLiveRegion="polite" style={[Typography.largeTitle, styles.title]}>{title}</Text>
            <Text style={[Typography.body, styles.description]}>{description}</Text>
          </View>

          <View style={styles.iconSection}>
            <SosActiveIcon width={90} height={90} />
          </View>
          {state.error ? <Text accessibilityLiveRegion="polite" style={[Typography.body, styles.description]}>{state.error}</Text> : null}
          <View style={{ gap: 16, paddingBottom: 24 }}>
            <Button title="Check SOS status" variant="secondary" isLoading={state.refreshing}
              disabled={state.phase === "submitting"} onPress={() => void state.refresh()} />
            {state.phase === "retry" ? <Button title="Retry the same SOS request" variant="secondary"
              onPress={() => void state.retry()} /> : null}
            {record ? <>
              <Text style={[Typography.bodySmall, styles.description]}>{record.location
                ? "Phone location snapshot captured " + new Date(record.location.capturedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) + " (Asia/Manila). This is not live tracking."
                : "Location unavailable or sharing disabled."}</Text>
              {record.recipients.some((recipient) => recipient.initial.errorCode === "location_omitted_message_limit") ?
                <Text style={[Typography.bodySmall, styles.description]}>Location was omitted because the SMS length limit was reached.</Text> : null}
              {record.recipients.map((recipient) => <View key={recipient.contactId} style={{ gap: 6 }}>
                <Text style={[Typography.button, { color: BrandColors.secondary }]}>{recipient.name} · {recipient.phone}</Text>
                <Text accessibilityLiveRegion="polite" style={{ color: BrandColors.secondary }}>{summary("Initial SMS", recipient.initial)}</Text>
                {recipient.ended ? <Text style={{ color: BrandColors.secondary }}>{summary("End update", recipient.ended)}</Text> : null}
              </View>)}
              {record.recipients.some((recipient) => recipient.initial.status === "unknown" || recipient.ended?.status === "unknown") ?
                <Text style={[Typography.bodySmall, styles.description]}>An unknown submission may have reached the contact. It will not be resent automatically.</Text> : null}
            </> : <View style={{ gap: 8 }}>
              <Text style={[Typography.button, { color: BrandColors.secondary }]}>Contact someone directly</Text>
              {state.contactsStatus === "error" ? <Button title="Retry loading contact numbers" variant="secondary"
                onPress={() => void state.loadContacts()} /> : null}
              {state.contacts.map((contact) => <Text key={contact.id} selectable style={{ color: BrandColors.secondary }}>
                {contact.name} · {contact.phoneNumber}
              </Text>)}
            </View>}
            {record?.status === "ended" ? <Button title="Back to SOS" variant="secondary" onPress={() => void close()} /> : null}
            {!record && state.phase === "idle" ? <Button title="Back to SOS" variant="secondary"
              onPress={() => router.replace("/sos")} /> : null}
          </View>
        </View>
      </PageLayout>
    </>
  );
}
