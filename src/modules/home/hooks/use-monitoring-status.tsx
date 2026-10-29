import WarningIcon from "@assets/icons/status/brown-warning.svg";
import GreenEyeIcon from "@assets/icons/status/green-eye.svg";
import RedEyeIcon from "@assets/icons/status/red-eye.svg";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { useAlertsList } from "@/modules/alerts/hooks/use-alerts";
import { useTheme } from "@/shared/hooks/use-theme";
import { monitoringState, type MonitoringStatusOptions } from "../utils/monitoring-state";

export type { MonitoringCardState } from "../utils/monitoring-state";

export function useMonitoringStatus(options: MonitoringStatusOptions) {
  const colors = useTheme();
  // Reuse Alerts' focus/foreground/60-second refresh so server-side archiving
  // reaches Home too. Read canonical entities for immediate seen/alarm updates.
  useAlertsList("active");
  const alerts = useAlertsStore((state) => state.alerts);
  const status = monitoringState(alerts, options);
  const warning = ["no-camera", "offline", "unavailable"].includes(status.state);
  const monitoringCardStyles = status.state === "threat" ? {
    backgroundColor: colors.dangerBackground, borderColor: colors.dangerStroke,
    titleColor: colors.dangerHeader, subtitleColor: colors.dangerSubHeader,
  } : warning ? {
    backgroundColor: colors.warningBackground, borderColor: colors.warningStroke,
    titleColor: colors.warningHeader, subtitleColor: colors.warningSubHeader,
  } : {
    backgroundColor: colors.card, borderColor: colors.border,
    titleColor: colors.text, subtitleColor: colors.textSecondary,
  };
  return {
    monitoringCardState: status.state, monitoringCardStyles,
    monitoringTitle: status.title, monitoringSubtitle: status.subtitle,
    monitoringIcon: status.state === "threat" ? <RedEyeIcon width={38} height={38} />
      : warning || status.state === "checking" ? <WarningIcon width={38} height={38} />
        : <GreenEyeIcon width={38} height={38} />,
  };
}
