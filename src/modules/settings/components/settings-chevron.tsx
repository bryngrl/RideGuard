import Svg, { Path } from "react-native-svg";

export function SettingsChevron({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M7 4L13 10L7 16" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
