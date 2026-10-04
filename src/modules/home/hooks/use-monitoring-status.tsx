import WarningIcon from "@assets/icons/status/brown-warning.svg";
import GreenEyeIcon from "@assets/icons/status/green-eye.svg";
import RedEyeIcon from "@assets/icons/status/red-eye.svg";
import { useEffect, useState, type ReactNode } from "react";

import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { Colors } from "@/shared/theme/colors";

export type MonitoringCardState = "no-camera" | "monitoring" | "threat";

interface UseMonitoringStatusOptions {
  hasCameraConnected: boolean;
}

export function useMonitoringStatus({
  hasCameraConnected,
}: UseMonitoringStatusOptions) {
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
      backgroundColor: Colors.light.warningBackground,
      borderColor: Colors.light.warningStroke,
      titleColor: Colors.light.warningHeader,
      subtitleColor: Colors.light.warningSubHeader,
    },
    monitoring: {
      backgroundColor: "#FFFFFF",
      borderColor: "#7b7b7b4f",
      titleColor: Colors.light.primary,
      subtitleColor: "#5D8063",
    },
    threat: {
      backgroundColor: Colors.light.dangerBackground,
      borderColor: Colors.light.dangerStroke,
      titleColor: Colors.light.dangerHeader,
      subtitleColor: Colors.light.dangerSubHeader,
    },
  }[monitoringCardState];

  let monitoringTitle = "Monitoring Active";
  let monitoringSubtitle = "Nothing detected right now.";
  let monitoringIcon: ReactNode = <GreenEyeIcon width={38} height={38} />;

  if (monitoringCardState === "no-camera") {
    monitoringTitle = "No Camera Connected";
    monitoringSubtitle = "Detection monitoring is inactive.";
    monitoringIcon = <WarningIcon width={38} height={38} />;
  } else if (monitoringCardState === "threat") {
    monitoringIcon = <RedEyeIcon width={38} height={38} />;

    if (isViolenceAndWeaponDetected) {
      monitoringTitle = "Violence and Weapon detected";
      monitoringSubtitle = "Critical threat. SOS activated automatically.";
    } else if (isViolenceDetected) {
      monitoringTitle = "Violence detected";
      monitoringSubtitle = showFollowUpThreatMessage
        ? "Auto-capturing initiated due to violence.\nSOS activated automatically."
        : "Unusual movement was detected.\nSOS activated automatically.";
    } else {
      monitoringTitle = "Weapon detected";
      monitoringSubtitle = showFollowUpThreatMessage
        ? "Auto-capturing initiated due to weapon detection."
        : "Need immediate attention.";
    }
  } else {
    // TODO: Update for movement detection.
    monitoringTitle = "Monitoring Active";
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
