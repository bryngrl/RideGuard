import { apiClient } from "@/shared/api";

interface StandardEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface PhoneCameraDto {
  device_id: string;
  source: "phone";
  created: boolean;
}

interface PhoneSessionDto {
  session_id: string;
  device_id: string;
  upload_token: string;
  duration_ms: number;
  started_at: string;
  expires_at: string;
}

export interface PhoneSession {
  sessionId: string;
  deviceId: string;
  uploadToken: string;
  expiresAt: string;
}

/**
 * Create or return this installation's phone camera. Safe to call on every
 * launch. POST /devices/phone
 */
export async function registerPhoneCamera(
  firebaseToken: string,
  installationId: string,
): Promise<string> {
  const envelope = await apiClient.post<StandardEnvelope<PhoneCameraDto>>(
    "/devices/phone",
    { installation_id: installationId },
    firebaseToken,
  );
  return envelope.data.device_id;
}

/**
 * Start an upload session. The token goes straight to the native service and
 * is never stored or logged. POST /devices/phone/:device_id/sessions
 */
export async function startPhoneSession(
  firebaseToken: string,
  deviceId: string,
  durationMs: number,
): Promise<PhoneSession> {
  const envelope = await apiClient.post<StandardEnvelope<PhoneSessionDto>>(
    `/devices/phone/${encodeURIComponent(deviceId)}/sessions`,
    { duration_ms: durationMs },
    firebaseToken,
  );
  const dto = envelope.data;
  return {
    sessionId: dto.session_id,
    deviceId: dto.device_id,
    uploadToken: dto.upload_token,
    expiresAt: dto.expires_at,
  };
}

/** End a session. Idempotent. DELETE /devices/phone/:device_id/sessions/:id */
export async function endPhoneSession(
  firebaseToken: string,
  deviceId: string,
  sessionId: string,
): Promise<void> {
  await apiClient.delete<null>(
    `/devices/phone/${encodeURIComponent(deviceId)}/sessions/${encodeURIComponent(sessionId)}`,
    firebaseToken,
  );
}
