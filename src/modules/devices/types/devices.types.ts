export interface DeviceApiResponse<T = Record<string, unknown>> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  statusCode?: number;
  fields?: Record<string, string>;
}

export type DeviceType = "Camera" | "Metal-Detector";
