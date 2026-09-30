import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  Alert as RNAlert,
  ScrollView,
  Text,
  View,
} from "react-native";

import ClockIcon from "@/assets/icons/misc/clock.svg";
import InformationIcon from "@/assets/icons/misc/information.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";

import { DUMMY_ALERTS } from "../data/alerts.dummy";
import type { Alert } from "../types/alert.types";
import {
  bannerStyles,
  contentStyles,
  footerStyles,
  gridStyles,
  responseStyles,
  timelineStyles,
} from "./alert-detail-screen.styles";

// Severity Label Map 

const SEVERITY_LABEL: Record<Alert["severity"], string> = {
  all_clear: "All clear",
  possible_threat: "Possible threat",
  metal_detected: "Metal object detected",
};

// 2×2 grid

interface SnapshotGridProps {
  uris: string[];
}

function SnapshotGrid({ uris }: SnapshotGridProps) {
  const theme = useTheme();

  // Always show 4 cells; blank if no URI provided
  const cells = Array.from({ length: 4 }, (_, i) => uris[i] ?? null);

  return (
    <View style={gridStyles.container}>
      {cells.map((uri, idx) => (
        <View
          key={idx}
          style={[
            gridStyles.cell,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={gridStyles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={gridStyles.placeholder}>
              <Text
                style={{
                  color: theme.textInactive,
                  fontSize: 11,
                }}
              >
                No snapshot
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// Auto delete notice banner

interface AutoDeleteBannerProps {
  label: string;
}

function AutoDeleteBanner({ label }: AutoDeleteBannerProps) {
  const theme = useTheme();

  const handleChange = () => {
    RNAlert.alert("Change setting", "Auto-delete duration settings");
  };

  return (
    <View
      style={[
        bannerStyles.container,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={bannerStyles.iconContainer}>
        <ClockIcon width={16} height={16} color={theme.text} />
      </View>

      <View style={bannerStyles.textBlock}>
        <Text
          style={[
            Typography.medium,
            bannerStyles.mainText,
            { color: theme.textMuted },
          ]}
        >
          {label}
        </Text>

        <View style={bannerStyles.infoRow}>
          <Text
            style={[
              Typography.bodySmall,
              bannerStyles.infoText,
              { color: theme.textInactive },
            ]}
            numberOfLines={1}
          >
            Viewable in-app only for 47h, then automatically deleted.
          </Text>
        </View>

        <Pressable
          onPress={handleChange}
          hitSlop={Spacing.one}
          accessibilityRole="button"
          accessibilityLabel="Change auto-delete setting"
        >
          <Text
            style={[
              Typography.medium,
              bannerStyles.changeText,
              { color: BrandColors.accent },
            ]}
          >
            Change
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Timeline 

interface TimelineProps {
  events: Alert["timeline"];
}

function Timeline({ events }: TimelineProps) {
  const theme = useTheme();

  return (
    <View style={timelineStyles.container}>
      <Text
        style={[
          Typography.h2,
          timelineStyles.sectionTitle,
          { color: theme.text },
        ]}
      >
        Timeline
      </Text>

      {events.map((event, idx) => (
        <View key={idx} style={timelineStyles.row}>
          <Text
            style={[
              Typography.bodySmall,
              timelineStyles.time,
              { color: theme.textMuted },
            ]}
          >
            {event.time}
          </Text>

          <Text
            style={[
              Typography.bodySmall,
              timelineStyles.description,
              { color: theme.text },
            ]}
          >
            {event.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Response section

interface ResponseProps {
  contactsNotified: boolean;
}

function Response({ contactsNotified }: ResponseProps) {
  const theme = useTheme();

  return (
    <View style={responseStyles.container}>
      <Text
        style={[
          Typography.h2,
          responseStyles.sectionTitle,
          { color: theme.text },
        ]}
      >
        Response
      </Text>

      <View style={responseStyles.row}>
        <InformationIcon height={16} width={16} />

        <Text style={[Typography.bodySmall, { color: theme.textInactive }]}>
          {contactsNotified
            ? "Emergency contacts were notified."
            : "No emergency contacts were notified."}
        </Text>
      </View>
    </View>
  );
}

// !! MAIN SCREEN !! MAIN SCREEN 

export function AlertDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFlagLoading, setIsFlagLoading] = useState(false);

  // Lookup the alert from dummy data.
  const alert = DUMMY_ALERTS.find((a) => a.id === id);

  if (!alert) {
    return (
      <PageLayout title="Alert details" showBackButton>
        <Text style={{ color: theme.textInactive }}>Alert not found.</Text>
      </PageLayout>
    );
  }

  const severityLabel = SEVERITY_LABEL[alert.severity];
  const isFalseAlarm = alert.status === "false_alarm";

  const handleFlagAsFalseAlarm = () => {
    RNAlert.alert(
      "Flag as false alarm?",
      "This will mark the alert as a false alarm and notify your contacts if any were alerted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Flag",
          style: "destructive",
          onPress: async () => {
            setIsFlagLoading(true);

            try {
              // TODO: call API to mark false alarm
              await new Promise((res) => setTimeout(res, 1000));
            } finally {
              setIsFlagLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <PageLayout
      title="Alert details"
      showBackButton
      scrollable={false}
      contentFlush
      footer={
        !isFalseAlarm ? (
          <Button
            title="Flag as false alarm"
            variant="danger"
            size="md"
            isLoading={isFlagLoading}
            onPress={handleFlagAsFalseAlarm}
            style={footerStyles.flagButton}
            textStyle={footerStyles.flagButtonText}
          />
        ) : null
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyles.scroll}
      >
        {/* Alert title + date */}
        <View style={contentStyles.titleRow}>
          <View style={contentStyles.titleBlock}>
            <Text
              style={[
                Typography.h2,
                contentStyles.alertTitle,
                {
                  color:
                    alert.severity === "possible_threat"
                      ? BrandColors.error
                      : theme.text,
                },
              ]}
            >
              {severityLabel}
            </Text>

            <Text
              style={[Typography.bodySmall, { color: theme.textInactive }]}
            >
              Today
            </Text>
          </View>

          <Text
            style={[
              Typography.bodySmall,
              contentStyles.timeLabel,
              { color: theme.textInactive },
            ]}
          >
            {alert.timeline[alert.timeline.length - 1]?.time ?? ""}
          </Text>
        </View>

        {/* 2×2 Snapshot grid */}
        <SnapshotGrid uris={alert.snapshotUris ?? []} />

        {/* Auto-delete notice */}
        {alert.autoDeleteLabel ? (
          <AutoDeleteBanner label={alert.autoDeleteLabel} />
        ) : null}

        {/* Timeline  */}
        <Timeline events={alert.timeline} />

        {/* Respones */}
        <Response contactsNotified={alert.contactsNotified} />
      </ScrollView>
    </PageLayout>
  );
}
