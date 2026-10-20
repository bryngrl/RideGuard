import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Alert as RNAlert, FlatList, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useEffect, useState } from "react";

import ClockIcon from "@/assets/icons/misc/clock.svg";
import InformationIcon from "@/assets/icons/misc/information.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";

import { ClipPlayerModal } from "../components/clip-player-modal";
import { useAlertDetails } from "../hooks/use-alert-details";
import {
  formatClockTime,
  formatRelativeDay,
  getAlertDetectionType,
  getSnapshotUris,
} from "../services/alerts.mapper";
import {
  bannerStyles,
  clipStyles,
  contentStyles,
  footerStyles,
  gridStyles,
  responseStyles,
  viewerStyles,
} from "./alert-detail-screen.styles";

// 2×2 grid placeholder

interface SnapshotViewerProps {
  uris: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

function SnapshotViewer({
  uris,
  initialIndex,
  visible,
  onClose,
}: SnapshotViewerProps) {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={viewerStyles.container}>
        <FlatList
          key={`${visible}-${initialIndex}`}
          data={uris}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          onMomentumScrollEnd={(event) => {
            setCurrentIndex(
              Math.round(event.nativeEvent.contentOffset.x / width),
            );
          }}
          renderItem={({ item }) => (
            <View style={{ height, width }}>
              <Image
                source={{ uri: item }}
                style={viewerStyles.image}
                resizeMode="contain"
              />
            </View>
          )}
        />

        <Pressable
          onPress={onClose}
          style={viewerStyles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close image viewer"
          hitSlop={8}
        >
          <Text style={viewerStyles.closeText}>×</Text>
        </Pressable>

        {uris.length > 1 ? (
          <Text style={viewerStyles.pageIndicator}>
            {currentIndex + 1}/{uris.length}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

interface SnapshotGridProps {
  uris?: string[];
  onSnapshotPress: (index: number) => void;
  /** A clip exists for this alert. The first cell becomes a "Play clip" tile
   * instead of a snapshot, even with no thumbnail image. */
  hasVideo?: boolean;
  onPlayClip?: () => void;
}

function PlaceholderCell({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={[gridStyles.cell, { backgroundColor: theme.backgroundElement }]}
    >
      <View style={gridStyles.placeholder}>
        <Text
          style={{
            color: theme.textInactive,
            fontSize: 11,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function PlayClipCell({
  uri,
  onPress,
}: {
  uri: string | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[gridStyles.cell, { backgroundColor: theme.backgroundElement }]}
    >
      <Pressable
        onPress={onPress}
        style={gridStyles.snapshotButton}
        accessibilityRole="button"
        accessibilityLabel="Play clip"
      >
        {uri ? (
          <Image source={{ uri }} style={gridStyles.image} resizeMode="cover" />
        ) : null}
        <View style={gridStyles.playOverlay} pointerEvents="none">
          <Ionicons name="play-circle" size={36} color="#FFFFFF" />
        </View>
      </Pressable>
    </View>
  );
}

function SnapshotGrid({
  uris = [],
  onSnapshotPress,
  hasVideo = false,
  onPlayClip,
}: SnapshotGridProps) {
  // The clip's thumbnail is the same image as snapshot 0. Playing it still
  // works with no thumbnail: PlayClipCell falls back to a plain placeholder.
  const restUris = hasVideo ? uris.slice(1) : uris;
  const cellCount = 4 - (hasVideo ? 1 : 0);
  const cells = Array.from(
    { length: cellCount },
    (_, i) => restUris[i] ?? null,
  );
  const snapshotOffset = hasVideo ? 1 : 0;

  if (!hasVideo && uris.length === 0) {
    return (
      <View style={gridStyles.container}>
        {Array.from({ length: 4 }, (_, i) => (
          <PlaceholderCell key={i} label="Snapshots coming soon" />
        ))}
      </View>
    );
  }

  return (
    <View style={gridStyles.container}>
      {hasVideo ? (
        <PlayClipCell uri={uris[0] ?? null} onPress={() => onPlayClip?.()} />
      ) : null}
      {cells.map((uri, idx) =>
        uri ? (
          <View
            key={idx}
            style={[gridStyles.cell, { backgroundColor: "transparent" }]}
          >
            <Pressable
              onPress={() => onSnapshotPress(idx + snapshotOffset)}
              style={gridStyles.snapshotButton}
              accessibilityRole="button"
              accessibilityLabel={`Open snapshot ${idx + snapshotOffset + 1}`}
            >
              <Image
                source={{ uri }}
                style={gridStyles.image}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        ) : (
          <PlaceholderCell key={idx} label="No snapshot" />
        ),
      )}
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
          feedbackRadius={9999}
          hitSlop={Spacing.one}
          accessibilityRole="button"
          accessibilityLabel="Change auto-delete setting"
        >
          <Text
            style={[
              Typography.button,
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
            ? "Emergency contacts have been notified. They can track your live location."
            : "No emergency contacts were notified."}
        </Text>
      </View>
    </View>
  );
}

// !! MAIN SCREEN !! MAIN SCREEN

export function AlertDetailScreen() {
  const theme = useTheme();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [clipOpen, setClipOpen] = useState(false);

  // Get alert data from hook
  const { alert, isSubmitting, markAsFalseAlarm } = useAlertDetails();

  if (!alert) {
    return (
      <PageLayout title="Alert details" showBackButton>
        <Text style={{ color: theme.textInactive }}>
          Alert no longer available
        </Text>
      </PageLayout>
    );
  }

  const isFalseAlarm = alert.isFalseAlarm === true;
  const detectionType = getAlertDetectionType(alert.message);
  const snapshotUris = getSnapshotUris(alert.imageUrl);
  const hasVideo = Boolean(alert.videoUrl);
  const isViolenceType =
    detectionType === "violence" || detectionType === "both";

  const handleFlagAsFalseAlarm = () => {
    RNAlert.alert(
      "Mark as false alarm?",
      "This will mark the alert as a false alarm and notify your contacts if any were alerted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark as false alarm",
          style: "destructive",
          onPress: markAsFalseAlarm,
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
            title="Mark as false alarm"
            variant="danger"
            size="md"
            isLoading={isSubmitting}
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
                    detectionType === "none"
                      ? BrandColors.success
                      : BrandColors.error,
                },
              ]}
            >
              {alert.message}
            </Text>

            <Text style={[Typography.bodySmall, { color: theme.textInactive }]}>
              {formatRelativeDay(alert.timeStamp)}
            </Text>

            {isFalseAlarm ? (
              <Text style={[Typography.bodySmall, { color: "#0046CE" }]}>
                Marked as false alarm
              </Text>
            ) : null}
          </View>

          <Text
            style={[
              Typography.bodySmall,
              contentStyles.timeLabel,
              { color: theme.textInactive },
            ]}
          >
            {formatClockTime(alert.timeStamp)}
          </Text>
        </View>

        {/* Image or Placeholder */}
        <SnapshotGrid
          uris={snapshotUris}
          hasVideo={hasVideo}
          onPlayClip={() => setClipOpen(true)}
          onSnapshotPress={(index) => {
            setViewerIndex(index);
            setViewerVisible(true);
          }}
        />
        <SnapshotViewer
          uris={snapshotUris}
          initialIndex={viewerIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
        {/* 2×2 Snapshot grid - shows placeholder if no data */}

        {isViolenceType && !hasVideo ? (
          <Text
            style={[
              Typography.bodySmall,
              clipStyles.unavailableText,
              { color: theme.textInactive },
            ]}
          >
            Video unavailable
          </Text>
        ) : null}

        {clipOpen && alert.videoUrl ? (
          <ClipPlayerModal
            uri={alert.videoUrl}
            onClose={() => setClipOpen(false)}
          />
        ) : null}

        {/* Auto-delete notice. Clip evidence has no deletion schedule yet, so
            the claim below would be false for it. */}
        {hasVideo ? null : <AutoDeleteBanner label="Auto-deletes in 47h 12m" />}

        {/* Response */}
        <Response contactsNotified={true} />
      </ScrollView>
    </PageLayout>
  );
}
