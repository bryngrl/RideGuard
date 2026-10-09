export type ButtonTestType = "short" | "long";
export type TestState = "waiting" | "success" | "timeout";
export type ButtonColor = "white" | "red";

export type ButtonHardwareEvent =
  | { type: "pulse"; button: ButtonColor }
  | { type: "long-press"; button: "red" };
