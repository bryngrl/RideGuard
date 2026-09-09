import MainLogo from "@/assets/icons/main-logo.svg";
import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
const screenWidth = Dimensions.get("window").width;

export default function CameraPreviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleDone = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/complete-setup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <MainLogo width={64} height={64} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Camera angle{"\n"}preview
            </Text>
            <Text
              style={[
                Typography.body,
                {
                  color: theme.textMuted,
                  marginTop: Spacing.two,
                },
              ]}
            >
              Passenger seat is fully within frame — no adjustment needed.
            </Text>
          </View>
        </View>

        <View style={styles.previewContainer}>
          <Image
            source={require("@/assets/images/placeholder-camera-preview.png")}
            style={styles.previewImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.footerContainer}>
          <Button
            title="Done"
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleDone}
            isLoading={isLoading}
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    paddingTop: 72,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.three,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  previewContainer: {
    width: screenWidth,
    height: 240,
    alignSelf: "center",
    justifyContent: "center",
    marginVertical: Spacing.three,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  footerContainer: {
    marginTop: "auto",
    paddingTop: Spacing.two,
    width: "100%",
  },
});
