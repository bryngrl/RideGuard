import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import MainLogo from "@/assets/icons/logos/main.svg";
import { ThemedText } from "@/components/themed-text";

import { useGoogleSignin } from "../hooks/use-google-signin";

import { useTheme } from "@/shared/hooks/use-theme";
import { GoogleButton } from "@/shared/ui/google-button";

import { BrandColors, Typography } from "@/shared/theme";

import { checkIsOldUser } from "../services/auth.api";

import { styles } from "./login-screen.styles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const FULL_BRAND_NAME = "ideguard";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { signIn } = useGoogleSignin();

  const logoScale = useSharedValue(2.2);
  const heroTranslateY = useSharedValue(SCREEN_HEIGHT * 0.28);

  const [typedText, setTypedText] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      const user = await signIn();

      if (user) {
        const firebaseToken = await user.getIdToken();
        const isOldUser = await checkIsOldUser(firebaseToken);

        if (isOldUser) {
          router.replace("/(app)/(tabs)");
        } else {
          router.replace("/(onboarding)/register/profile");
        }
      }
    } catch (error) {
      console.error("Google Sign-In failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Google Sign-In failed.",
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Intro animation and typewriter effect
  useEffect(() => {
    logoScale.value = withDelay(
      700,
      withSpring(1.0, {
        damping: 15,
        stiffness: 75,
      }),
    );

    heroTranslateY.value = withDelay(
      700,
      withSpring(0, {
        damping: 15,
        stiffness: 75,
      }),
    );

    let currentIndex = 0;

    const typingTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < FULL_BRAND_NAME.length) {
          setTypedText(FULL_BRAND_NAME.slice(0, currentIndex + 1));

          currentIndex++;
        } else {
          clearInterval(interval);
          setShowCursor(false);
        }
      }, 70);

      return () => clearInterval(interval);
    }, 1300);

    return () => {
      clearTimeout(typingTimeout);
    };
  }, []);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: heroTranslateY.value },
    ],
  }));

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.heroWrapper}>
          <Animated.View style={[styles.heroRow, animatedHeroStyle]}>
            <MainLogo width={64} height={64} />

            {typedText.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(150)}
                style={styles.brandNameContainer}
              >
                <ThemedText style={styles.brandNameText}>
                  {typedText}

                  {showCursor && (
                    <ThemedText style={styles.cursor}>|</ThemedText>
                  )}
                </ThemedText>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(650)
            .delay(1600)
            .easing(Easing.out(Easing.cubic))}
          style={styles.bottomSection}
        >
          <View style={styles.textGroup}>
            <ThemedText
              style={[
                styles.subtitle,
                Typography.h2,
                {
                  color: BrandColors.primary,
                },
              ]}
            >
              Log in to your account
            </ThemedText>

            <ThemedText
              style={[
                styles.subtitle,
                Typography.caption,
                {
                  color: theme.textMuted,
                },
              ]}
            >
              Real-time threat detection for every ride.
            </ThemedText>
          </View>

          <View style={styles.buttonGroup}>
            <GoogleButton
              title="Continue with Google"
              isLoading={isGoogleLoading}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            />
          </View>

          <View style={styles.legalContainer}>
            <ThemedText
              style={[
                styles.legalText,
                {
                  color: theme.textMuted,
                },
              ]}
            >
              By continuing, you agree to our{" "}
              <ThemedText
                onPress={() => router.push("/terms/terms")}
                style={[
                  styles.legalLink,
                  {
                    color: BrandColors.accent,
                  },
                ]}
              >
                Terms of service
              </ThemedText>
              {"\n and "}
              <ThemedText
                onPress={() => router.push("/privacy/privacy")}
                style={[
                  styles.legalLink,
                  {
                    color: BrandColors.accent,
                  },
                ]}
              >
                Privacy Policy
              </ThemedText>
              .
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}