import { APIError } from "./errors";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

export interface RequestOptions extends RequestInit {
  token?: string;
}

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

      console.error("API ERROR:", {
        status: response.status,
        data,
      });

      throw new APIError(message, response.status, data);
    }

    return data as T;
  }

  get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      token,
    });
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
}

export const apiClient = new APIClient();
