import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Modal,
  Alert as RNAlert,
  FlatList,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useEffect, useState } from "react";

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
  clipStyles,
  contentStyles,
  footerStyles,
  previewStyles,
  responseStyles,
  viewerStyles,
} from "./alert-detail-screen.styles";

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

// Evidence preview

interface EvidenceImageProps {
  uri: string;
  resizeMode: "contain" | "cover";
  onLoad?: () => void;
}

/** An image with its own loading spinner and "Image unavailable" fallback.
 * Give it a `key` of its URI so state resets when the image changes. */
function EvidenceImage({ uri, resizeMode, onLoad }: EvidenceImageProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );

  if (status === "failed") {
    return (
      <View style={previewStyles.centered}>
        <Text style={[Typography.bodySmall, { color: theme.textInactive }]}>
          Image unavailable
        </Text>
      </View>
    );
  }

  return (
    <>
      <Image
        source={{ uri }}
        style={previewStyles.image}
        resizeMode={resizeMode}
        onLoad={() => {
          setStatus("loaded");
          onLoad?.();
        }}
        onError={() => setStatus("failed")}
      />
      {status === "loading" ? (
        <View style={previewStyles.centered} pointerEvents="none">
          <ActivityIndicator color={theme.textInactive} />
        </View>
      ) : null}
    </>
  );
}

interface EvidencePreviewProps {
  uris: string[];
  hasVideo: boolean;
  onPlayClip: () => void;
  onOpenImage: (index: number) => void;
}

/** One large preview plus a gallery only when there are several images. With a
 * clip, the first image is its thumbnail and the preview plays the clip. */
function EvidencePreview({
  uris,
  hasVideo,
  onPlayClip,
  onOpenImage,
}: EvidencePreviewProps) {
  const theme = useTheme();
  const mainUri = uris[0] ?? null;
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  useEffect(() => setThumbnailLoaded(false), [mainUri]);

  return (
    <View style={previewStyles.container}>
      <Pressable
        onPress={() => {
          if (hasVideo) onPlayClip();
          else if (mainUri) onOpenImage(0);
        }}
        disabled={!hasVideo && !mainUri}
        style={[
          previewStyles.main,
          { backgroundColor: theme.backgroundElement },
        ]}
        accessibilityRole={hasVideo || mainUri ? "button" : "image"}
        accessibilityLabel={
          hasVideo
            ? "Play clip"
            : mainUri
              ? "Open image full screen"
              : "Image unavailable"
        }
      >
        {mainUri ? (
          <EvidenceImage
            key={mainUri}
            uri={mainUri}
            resizeMode="contain"
            onLoad={() => setThumbnailLoaded(true)}
          />
        ) : hasVideo ? null : (
          <View style={previewStyles.centered}>
            <Text style={[Typography.bodySmall, { color: theme.textInactive }]}>
              Image unavailable
            </Text>
          </View>
        )}

        {hasVideo ? (
          <View style={previewStyles.playOverlay} pointerEvents="none">
            <View style={previewStyles.playButton}>
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={[Typography.medium, previewStyles.playText]}>
                Play clip
              </Text>
            </View>
          </View>
        ) : null}
      </Pressable>

      {hasVideo && mainUri && thumbnailLoaded && uris.length === 1 ? (
        <Pressable
          onPress={() => onOpenImage(0)}
          feedbackRadius={9999}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          accessibilityLabel="View image full screen"
          style={previewStyles.viewImage}
        >
          <Text style={[Typography.medium, { color: BrandColors.accent }]}>
            View image
          </Text>
        </Pressable>
      ) : null}

      {uris.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={previewStyles.gallery}
        >
          {uris.map((uri, index) => (
            <Pressable
              key={`${uri}-${index}`}
              onPress={() => onOpenImage(index)}
              style={[
                previewStyles.thumb,
                { backgroundColor: theme.backgroundElement },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open image ${index + 1} of ${uris.length}`}
            >
              <EvidenceImage key={uri} uri={uri} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
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
  const hasVideo = Boolean(alert.videoUrl?.trim());
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

        <EvidencePreview
          key={alert.alertId}
          uris={snapshotUris}
          hasVideo={hasVideo}
          onPlayClip={() => setClipOpen(true)}
          onOpenImage={(index) => {
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

        <Text
          style={[
            Typography.bodySmall,
            contentStyles.cameraLabel,
            { color: theme.textInactive },
          ]}
        >
          Camera {alert.deviceId}
        </Text>

        {clipOpen && alert.videoUrl ? (
          <ClipPlayerModal
            uri={alert.videoUrl}
            onClose={() => setClipOpen(false)}
          />
        ) : null}

        {/* Response */}
        <Response contactsNotified={true} />
      </ScrollView>
    </PageLayout>
  );
}
