import { AlertsScreen } from "@/modules/alerts/screens/alerts-screen";

/** Settings and Alerts share the backend archive query and all list behavior. */
export function ArchivesScreen() {
  return <AlertsScreen archivedOnly />;
}
