export class APIError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);

    this.name = "APIError";
    this.status = status;
    this.data = data;

    Object.setPrototypeOf(this, APIError.prototype);
  }
}
