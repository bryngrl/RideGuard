import MainLogo from "@/assets/icons//logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Stepper } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const screenWidth = Dimensions.get("window").width;

export function CameraPreviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleDone = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/(onboarding)/register/complete-setup" as any);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper currentStep={5} steps={10} size={6} />
        </View>
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
            source={require("@/assets/images/placeholder/placeholder-camera-preview.png")}
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
  stepperContainer: { alignItems: "center", marginBottom: Spacing.five },

  footerContainer: {
    marginTop: "auto",
    paddingTop: Spacing.two,
    width: "100%",
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.three,
  },
  previewContainer: {
    alignSelf: "center",
    height: 240,
    justifyContent: "center",
    marginVertical: Spacing.three,
    width: screenWidth,
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  topSection: {
    paddingTop: 72,
  },
});
