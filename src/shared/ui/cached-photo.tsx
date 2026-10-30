import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { SkeletonPulse } from "./skeleton-pulse";

/** Never show an empty avatar while a saved photo downloads or fails. */
export function CachedPhoto({ uri, style, placeholder, label = "Loading contact photo" }: { uri: string; style: StyleProp<ViewStyle>; placeholder: ReactNode; label?: string }) {
  return <PhotoSource key={uri} uri={uri} style={style} placeholder={placeholder} label={label} />;
}

function PhotoSource({ uri, style, placeholder, label }: { uri: string; style: StyleProp<ViewStyle>; placeholder: ReactNode; label: string }) {
  const theme = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <View style={[style, styles.frame]}>
    <View style={styles.placeholder} pointerEvents="none">{placeholder}</View>
    <SkeletonPulse active={!loaded && !failed} label={label} style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.border }]} />
    </SkeletonPulse>
    {!failed && <Image source={{ uri }} style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
      cachePolicy="memory-disk" contentFit="cover" recyclingKey={uri} allowDownscaling
      onLoad={() => setLoaded(true)} onError={() => {
        setFailed(true);
        console.info("[Photo] Image unavailable", { host: /^https?:\/\/([^/]+)/.exec(uri)?.[1] ?? "local" });
      }} />}
  </View>;
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden" },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
