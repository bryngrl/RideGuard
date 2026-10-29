import { type NativeModule, requireOptionalNativeModule } from "expo";

export type ScreenSecurityState = { screenOffCount: number; interactive: boolean; locked: boolean };
declare class AppSecurityModule extends NativeModule<{ onScreenState: (state: ScreenSecurityState) => void }> {
  getScreenState(): ScreenSecurityState;
}
export const AppSecurity = requireOptionalNativeModule<AppSecurityModule>("AppSecurity");
