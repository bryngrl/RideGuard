import { apiClient } from "@/shared/api";

import type { LiveCamera } from "../types/live-camera.types";

/**
 * Standard success envelope wrapped around every backend response.
 */
interface StandardEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Raw camera shape from the backend. Snake_case on the wire; mapped to the
 * camelCase LiveCamera the app uses.
 */
interface CameraDto {
  device_id: string;
  stream_url: string | null;
  online: boolean;
  last_seen_at: string | null;
}

function mapCamera(dto: CameraDto): LiveCamera {
  return {
    deviceId: dto.device_id,
    streamUrl: dto.stream_url ?? null,
    online: Boolean(dto.online),
    lastSeenAt: dto.last_seen_at ?? null,
  };
}

/**
 * Load the signed-in user's cameras with their current stream URLs. The base
 * URL already includes /v1, so we call "/devices/cameras" without duplicating
 * it.
 */
export async function getMyCameras(
  firebaseToken: string,
): Promise<LiveCamera[]> {
  const envelope = await apiClient.get<StandardEnvelope<CameraDto[]>>(
    "/devices/cameras",
    firebaseToken,
  );

  const list = Array.isArray(envelope?.data) ? envelope.data : [];

  return list.map(mapCamera);
}
