// TODO: A motion in the start

import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

WebBrowser.maybeCompleteAuthSession();

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const FULL_BRAND_NAME = "ideguard";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();

  const logoScale = useSharedValue(2.2);
  const heroTranslateY = useSharedValue(SCREEN_HEIGHT * 0.28);
  const [typedText, setTypedText] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
    webClientId: googleWebClientId,
    redirectUri: makeRedirectUri({
      scheme: "rideguard",
      path: "redirect",
    }),
  });

  // Logo pop & typing animation
  useEffect(() => {
    logoScale.value = withDelay(
      700,
      withSpring(1.0, { damping: 15, stiffness: 75 }),
    );

    heroTranslateY.value = withDelay(
      700,
      withSpring(0, { damping: 15, stiffness: 75 }),
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

    return () => clearTimeout(typingTimeout);
  }, []);

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }

    const loginWithFirebase = async () => {
      try {
        setIsGoogleLoading(true);
        const googleIdToken =
          response.params.id_token ?? response.authentication?.idToken;

        if (!googleIdToken) {
          alert("Google auth succeeded, but no id_token was returned.");
          setIsGoogleLoading(false);
          return;
        }

        const credential = GoogleAuthProvider.credential(googleIdToken);
        await signInWithCredential(auth, credential);
        router.replace("/auth/register-1");
      } catch (error: any) {
        alert(error instanceof Error ? error.message : "Unknown sign-in error");
      } finally {
        setIsGoogleLoading(false);
      }
    };

    void loginWithFirebase();
  }, [response]);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: heroTranslateY.value },
    ],
  }));

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await promptAsync();
    if (result.type === "dismiss" || result.type === "cancel") {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.heroWrapper}>
          <Animated.View style={[styles.heroRow, animatedHeroStyle]}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              contentFit="contain"
              priority="high"
            />
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
                { color: BrandColors.primary },
              ]}
            >
              Log in to your account
            </ThemedText>
            <ThemedText
              style={[
                styles.subtitle,
                Typography.caption,
                { color: theme.textMuted },
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
              disabled={!request || isGoogleLoading}
            />
          </View>

          <View style={styles.legalContainer}>
            <ThemedText style={[styles.legalText, { color: theme.textMuted }]}>
              By continuing, you agree to our{" "}
              <ThemedText
                onPress={() => router.push("/settings/terms")}
                style={[styles.legalLink, { color: BrandColors.accent }]}
              >
                Terms of service
              </ThemedText>
              {" and "}
              <ThemedText
                onPress={() => router.push("/settings/privacy")}
                style={[styles.legalLink, { color: BrandColors.accent }]}
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
    gap: Spacing.two,
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
    paddingTop: Spacing.one,
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
