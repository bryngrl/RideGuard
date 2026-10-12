export type ButtonTestType = "short" | "long";
export type TestState = "waiting" | "success" | "timeout";
export type ButtonColor = "white" | "red";

export type ButtonHardwareEvent =
  | { type: "pressed"; button: ButtonColor }
  | { type: "released"; button: ButtonColor };
