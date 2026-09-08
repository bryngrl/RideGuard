// TODO: A motion in the start

import MainLogo from "@/assets/icons/main-logo.svg";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
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

import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { ThemedText } from "@/components/themed-text";
import { GoogleButton } from "@/components/ui/google-button";

import {
  BrandColors,
  FontFamily,
  MaxContentWidth,
  Spacing,
  Typography,
} from "@/constants/theme";

import { useTheme } from "@/hooks/use-theme";
import { auth } from "@/lib/firebase";
import { checkIsOldUser } from "@/services/api";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  User,
} from "firebase/auth";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const FULL_BRAND_NAME = "ideguard";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();

  const logoScale = useSharedValue(2.2);
  const heroTranslateY = useSharedValue(SCREEN_HEIGHT * 0.28);

  const [typedText, setTypedText] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // authed user
  const handleAuthenticatedUser = async (user: User) => {
    const firebaseToken = await user.getIdToken();

    const isOldUser = await checkIsOldUser(firebaseToken);

    if (isOldUser) {
      router.replace("/(tabs)");
    } else {
      router.replace("/auth/register-1");
    }
  };

  // google sign in
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return;
      }

      const googleIdToken = response.data.idToken;

      if (!googleIdToken) {
        throw new Error(
          "Google Sign-In succeeded, but no ID token was returned.",
        );
      }
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCredential = await signInWithCredential(auth, credential);

      await handleAuthenticatedUser(userCredential.user);
    } catch (error) {
      console.error("Google Sign-In failed:", error);

      alert(error instanceof Error ? error.message : "Google Sign-In failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };
  // animation
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
      {
        scale: logoScale.value,
      },
      {
        translateY: heroTranslateY.value,
      },
    ],
  }));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        setIsCheckingAuth(true);

        await handleAuthenticatedUser(user);
      } catch (error) {
        console.error("Failed to check authenticated user:", error);

        setIsCheckingAuth(false);
      }
    });

    return unsubscribe;
  }, []);

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
                onPress={() => router.push("/settings/terms")}
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
                onPress={() => router.push("/settings/privacy")}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    justifyContent: "space-between",

    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  heroWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  logo: {
    width: 100,
    height: 100,
  },
  brandNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -15,
    marginTop: 25,
    marginRight: 15,
    zIndex: 1,
  },
  brandNameText: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 34,
    lineHeight: 40,
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },
  cursor: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 32,
    color: BrandColors.accent,
  },
  bottomSection: {
    width: "100%",
    gap: Spacing.four,
  },
  textGroup: {
    gap: Spacing.one,
    alignItems: "center",
  },
  mainTitle: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    paddingTop: Spacing.half,
  },
  legalContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.two,
  },
  legalText: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  legalLink: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
