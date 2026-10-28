import WarningIcon from "@assets/icons/status/brown-warning.svg";
import GreenEyeIcon from "@assets/icons/status/green-eye.svg";
import RedEyeIcon from "@assets/icons/status/red-eye.svg";
import { useEffect, useState, type ReactNode } from "react";

import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { useTheme } from "@/shared/hooks/use-theme";

export type MonitoringCardState = "no-camera" | "monitoring" | "threat";

interface UseMonitoringStatusOptions {
  hasCameraConnected: boolean;
}

export function useMonitoringStatus({
  hasCameraConnected,
}: UseMonitoringStatusOptions) {
  const colors = useTheme();
  const alerts = useAlertsStore((state) => state.alerts);

  const latestAlert = [...alerts]
    .sort((a, b) => {
      const aTime = new Date(a.timeStamp).getTime();
      const bTime = new Date(b.timeStamp).getTime();

      return (
        (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
      );
    })
    .at(0);

  const alertMessage = latestAlert?.message?.trim().toLowerCase() ?? "";
  const isAllClear =
    latestAlert?.isFalseAlarm === true || alertMessage === "all clear";
  const isViolenceAndWeaponDetected =
    alertMessage.includes("violence and weapon");
  const isViolenceDetected =
    !isViolenceAndWeaponDetected && alertMessage.includes("violence");
  const isWeaponDetected =
    !isViolenceAndWeaponDetected && alertMessage.includes("weapon");
  const hasThreat =
    isViolenceAndWeaponDetected || isViolenceDetected || isWeaponDetected;

  const [showFollowUpThreatMessage, setShowFollowUpThreatMessage] =
    useState(false);

  useEffect(() => {
    if (!isViolenceDetected && !isWeaponDetected) {
      setShowFollowUpThreatMessage(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowFollowUpThreatMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isViolenceDetected, isWeaponDetected, latestAlert?.alertId]);

  const monitoringCardState: MonitoringCardState = !hasCameraConnected
    ? "no-camera"
    : hasThreat && !isAllClear
      ? "threat"
      : "monitoring";

  const monitoringCardStyles = {
    "no-camera": {
      backgroundColor: colors.warningBackground,
      borderColor: colors.warningStroke,
      titleColor: colors.warningHeader,
      subtitleColor: colors.warningSubHeader,
    },
    monitoring: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      titleColor: colors.text,
      subtitleColor: colors.textSecondary,
    },
    threat: {
      backgroundColor: colors.dangerBackground,
      borderColor: colors.dangerStroke,
      titleColor: colors.dangerHeader,
      subtitleColor: colors.dangerSubHeader,
    },
  }[monitoringCardState];

  let monitoringTitle = "Monitoring active";
  let monitoringSubtitle = "Nothing detected right now.";
  let monitoringIcon: ReactNode = <GreenEyeIcon width={38} height={38} />;

  if (monitoringCardState === "no-camera") {
    monitoringTitle = "No external camera";
    monitoringSubtitle = "Connect one to start monitoring";
    monitoringIcon = <WarningIcon width={38} height={38} />;
  } else if (monitoringCardState === "threat") {
    monitoringIcon = <RedEyeIcon width={38} height={38} />;

    if (isViolenceAndWeaponDetected) {
      monitoringTitle = "Violence and Weapon detected";
      monitoringSubtitle = "Use manual SOS if you need help.";
    } else if (isViolenceDetected) {
      monitoringTitle = "Violence detected";
      monitoringSubtitle = showFollowUpThreatMessage
        ? "Auto-capturing initiated due to violence.\nUse manual SOS if you need help."
        : "Unusual movement was detected.\nUse manual SOS if you need help.";
    } else {
      monitoringTitle = "Weapon detected";
      monitoringSubtitle = showFollowUpThreatMessage
        ? "Auto-capturing initiated due to weapon detection."
        : "Need immediate attention.";
    }
  } else {
    // TODO: Update for movement detection.
    monitoringTitle = "Monitoring active";
    monitoringSubtitle = "Nothing detected right now.";
  }

  return {
    monitoringCardState,
    monitoringCardStyles,
    monitoringTitle,
    monitoringSubtitle,
    monitoringIcon,
  };
}
