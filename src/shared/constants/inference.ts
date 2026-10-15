/** model-api base URL, including /v1. */
export const INFERENCE_BASE_URL = (
  process.env.EXPO_PUBLIC_INFERENCE_BASE_URL || "http://3.26.225.222:8000/v1"
).replace(/\/+$/, "");

/** Authenticated phone upload socket. https becomes wss. */
export const PHONE_UPLOAD_URL = `${INFERENCE_BASE_URL.replace(/^http/, "ws")}/inference/phone-stream`;
