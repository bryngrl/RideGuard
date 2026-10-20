import type { ComponentProps } from "react";

import { Spacing } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";

type SettingsPageLayoutProps = ComponentProps<typeof PageLayout>;

/** Align Settings detail content and footer with Home's 24 px content grid. */
export function SettingsPageLayout({ contentStyle, footerStyle, ...props }: SettingsPageLayoutProps) {
  return (
    <PageLayout
      {...props}
      contentStyle={[{ paddingHorizontal: Spacing.four }, contentStyle]}
      footerStyle={[{ paddingHorizontal: Spacing.four }, footerStyle]}
    />
  );
}
