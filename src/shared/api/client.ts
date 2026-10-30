import { APIError } from "./errors";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1"
).replace(/\/+$/, "");

export interface RequestOptions extends RequestInit {
  token?: string;
}

export class APIClient {
  private baseUrl: string;
  private pendingGets = new Map<string, Promise<unknown>>();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Bound shared reads as well as auth/onboarding, so a stalled transport
    // cannot pin future refreshes to an in-flight promise forever. Never retry
    // a potentially committed mutation automatically.
    if (!endpoint.startsWith("/auth/") && !endpoint.startsWith("/profile/") && options.method !== "GET") return this.performRequest<T>(endpoint, options);
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    else options.signal?.addEventListener("abort", abort, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.performRequest<T>(endpoint, { ...options, signal: controller.signal }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            reject(new APIError("Request timed out. Check your connection and try again.", 408, null, endpoint));
            controller.abort();
          }, 25_000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
    }
  }

  private async performRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const { token, headers, ...fetchOptions } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...headers,
      },
    });

    const rawResponse = await response.text();

    let data: unknown;

    try {
      data = rawResponse ? JSON.parse(rawResponse) : null;
    } catch {
      data = { message: rawResponse };
    }

    if (!response.ok) {
      let message = "An API request failed.";

      if (typeof data === "object" && data !== null) {
        if ("detail" in data) {
          const detail = data.detail;

          if (Array.isArray(detail)) {
            message = detail
              .map((error) => {
                if (
                  typeof error === "object" &&
                  error !== null &&
                  "msg" in error
                ) {
                  const field =
                    "loc" in error && Array.isArray(error.loc)
                      ? error.loc[error.loc.length - 1]
                      : "unknown field";

                  return `${field}: ${String(error.msg)}`;
                }

                return String(error);
              })
              .join(", ");
          } else {
            message = String(detail);
          }
        } else if ("message" in data) {
          const apiMessage = data.message;

          message = Array.isArray(apiMessage)
            ? apiMessage.join(", ")
            : String(apiMessage);
        }
      }

      // Azure and other gateways can return an HTML error page instead of
      // the API's JSON envelope. Never surface that markup as an app message.
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html") || /^\s*</.test(rawResponse)) {
        message = response.status === 503
          ? "Service unavailable. Try again later."
          : "Server error. Try again.";
      }

      // Keep only the route, never credentials, query values, or response data,
      // available to callers that need to diagnose a failed request.
      throw new APIError(message, response.status, data, endpoint.split("?")[0]);
    }

    return data as T;
  }

  get<T>(endpoint: string, token?: string): Promise<T> {
    // Multiple mounted screens can ask for the same account data at once.
    // Share only an in-flight read; later reads still reach the backend, and
    // different sessions never share responses. Mutations are never coalesced.
    const key = `${token ?? ""}\n${endpoint}`;
    const existing = this.pendingGets.get(key);
    if (existing) return existing as Promise<T>;
    const pending = this.request<T>(endpoint, {
      method: "GET",
      token,
    });
    this.pendingGets.set(key, pending);
    void pending.finally(() => {
      if (this.pendingGets.get(key) === pending) this.pendingGets.delete(key);
    }).catch(() => undefined);
    return pending;
  }

  post<T>(endpoint: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      token,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      token,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      token,
    });
  }
}

export const apiClient = new APIClient();
