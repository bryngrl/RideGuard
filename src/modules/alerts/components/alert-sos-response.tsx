import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { messagePresentation, type SosRecord } from "@/modules/sos/types";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { getAlertSos } from "../services/alert-sos.api";

export function AlertSosResponse({ alertId }: { alertId: string }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const [record, setRecord] = useState<SosRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    const controller = new AbortController();
    setRecord(null); setFetchedAt(null); setError(null); setLoading(true);
    if (!user) {
      setError("Sign in to check response status."); setLoading(false);
      return () => { active = false; controller.abort(); };
    }
    const current = () => active && !controller.signal.aborted && !!user && auth.currentUser?.uid === user.uid;
    const timer = setTimeout(() => {
      if (!active) return;
      controller.abort(); setError("Couldn't confirm response status. Reopen this alert to try again."); setLoading(false);
    }, 20_000);
    void (async () => {
      try {
        if (!user) throw new Error("Sign-in required");
        const token = await user.getIdToken();
        if (!current()) return;
        const result = await getAlertSos(token, alertId, controller.signal);
        if (!current()) return;
        setRecord(result); setFetchedAt(new Date().toLocaleTimeString());
      } catch {
        if (current()) setError("Response status is unavailable. Reopen this alert to try again.");
      } finally { clearTimeout(timer); if (current()) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [alertId, user]));

  return <View style={{ gap: Spacing.two }}>
    {loading ? <ActivityIndicator color={theme.accent} accessibilityLabel="Checking this alert's SOS response" /> : error ?
      <Text accessibilityRole="alert" style={[Typography.bodySmall, { color: theme.textMuted }]}>{error}</Text> : !record ?
      <Text style={[Typography.bodySmall, { color: theme.textMuted }]}>No SOS is linked to this alert.</Text> : <>
        <Text style={[Typography.medium, { color: theme.text }]}>{record.status === "active" ? "SOS active" : "SOS ended"}</Text>
        {record.recipients.map((recipient) => <View key={recipient.contactId} style={{ gap: Spacing.one, marginTop: Spacing.two }}>
          <Text style={[Typography.medium, { color: theme.text }]}>{recipient.name}</Text>
          {[{ title: "Start message", value: recipient.initial }, ...(recipient.ended ? [{ title: "End message", value: recipient.ended }] : [])].map(({ title, value }) => {
            const presentation = messagePresentation(value);
            return <View key={title}>
              <Text style={[Typography.bodySmall, { color: theme.text }]}>{title}: {presentation.label}</Text>
              <Text style={[Typography.bodySmall, { color: theme.textMuted }]}>{presentation.detail}</Text>
            </View>;
          })}
        </View>)}
      </>}
    {!!fetchedAt && <Text style={[Typography.bodySmall, { color: theme.textMuted }]}>Last checked {fetchedAt}</Text>}
  </View>;
}
