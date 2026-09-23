import type { AlertEvent } from "@/lib/ably/alerts";
import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";

import { normalizeAlert } from "./normalize-alert";

// The controller returns `{ data: Alert[]; nextCursor }`, wrapped again by the
// global ApiResponse envelope — hence the doubled `data` when unwrapping.
type AlertsPage = {
  data: unknown[];
  nextCursor: string | null;
};

export async function getAlerts(
  limit = 20,
  cursor?: string,
): Promise<AlertEvent[]> {
  return apiClient
    .get<ApiResponse<AlertsPage>>("/alerts", { params: { limit, cursor } })
    .then((response) => response.data.data.data.map(normalizeAlert))
    .catch((error) => {
      console.error("Error fetching alerts:", error);
      throw new Error("Failed to fetch alerts");
    });
}
