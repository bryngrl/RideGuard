export type ButtonTestType = "short" | "long";
export type TestState = "waiting" | "success" | "timeout";
export type ButtonColor = "white" | "red";

export type ButtonHardwareEvent =
  | { type: "pulse"; button: ButtonColor }
  | { type: "hold-start" | "hold-end"; button: "red" }
  | { type: "long-press"; button: "red" };
