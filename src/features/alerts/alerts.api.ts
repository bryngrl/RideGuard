import axios from "axios";

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
  signal?: AbortSignal,
): Promise<AlertEvent[]> {
  return apiClient
    .get<ApiResponse<AlertsPage>>("/alerts", { params: { limit, cursor }, signal })
    .then((response) => response.data.data.data.map(normalizeAlert))
    .catch((error) => {
      // Let cancellations pass through untouched so callers can ignore them
      // instead of surfacing a fetch error.
      if (axios.isCancel(error)) {
        throw error;
      }

      console.error("Error fetching alerts:", error);
      throw new Error("Failed to fetch alerts");
    });
}
