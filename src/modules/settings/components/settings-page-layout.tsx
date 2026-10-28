import type { ComponentProps } from "react";

import { actionFooterPadding, Spacing } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SettingsPageLayoutProps = ComponentProps<typeof PageLayout>;

/** Align Settings detail content and footer with Home's 24 px content grid. */
export function SettingsPageLayout({ contentStyle, footerStyle, ...props }: SettingsPageLayoutProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <PageLayout
      {...props}
      contentStyle={[{ paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: actionFooterPadding(bottom) }, contentStyle]}
      footerStyle={[{ paddingHorizontal: Spacing.four, paddingBottom: actionFooterPadding(bottom) }, footerStyle]}
    />
  );
}
