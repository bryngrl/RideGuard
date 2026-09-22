import MainLogo from '@/assets/icons/main-logo.svg';
import { ThemedText } from '@/shared/components/themed-text';
import { GoogleButton } from '@/shared/components/ui/google-button';
import {
  BrandColors,
  FontFamily,
  MaxContentWidth,
  Spacing,
  Typography,
} from '@/shared/constants/theme.constants';
import { useTheme } from '@/shared/hooks/use-theme';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreenProps } from '../auth.types';
import { useGoogleSignIn } from '../hooks/use-google-sign-in';
import { useLoginHeroAnimation } from '../hooks/use-login-hero-animation';

export function LoginScreen({ onTermsPress, onPrivacyPress }: LoginScreenProps) {
  const backgroundColor = useTheme().background;
  const mutedTextColor = useTheme().textMuted;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const heroAnimatedStyle = useLoginHeroAnimation(SCREEN_HEIGHT * 0.28);
  const [typedText] = useState('');
  const [showCursor] = useState(true);
  const { signIn: handleGoogleSignIn, isLoading: isGoogleLoading } = useGoogleSignIn();
  //  signIn,
  // isLoading,
  // error,
  // clearError,
  const onGoogleSignIn = () => void handleGoogleSignIn();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <View style={styles.heroWrapper}>
          <Animated.View style={[styles.heroRow, heroAnimatedStyle]}>
            <MainLogo width={64} height={64} />

            {typedText.length > 0 && (
              <Animated.View entering={FadeIn.duration(150)} style={styles.brandNameContainer}>
                <ThemedText style={styles.brandNameText}>
                  {typedText}

                  {showCursor && <ThemedText style={styles.cursor}>|</ThemedText>}
                </ThemedText>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(650).delay(1600).easing(Easing.out(Easing.cubic))}
          style={styles.bottomSection}
        >
          <View style={styles.textGroup}>
            <ThemedText style={[styles.subtitle, Typography.h2, { color: BrandColors.primary }]}>
              Log in to your account
            </ThemedText>

            <ThemedText style={[styles.subtitle, Typography.caption, { color: mutedTextColor }]}>
              Real-time threat detection for every ride.
            </ThemedText>
          </View>

          <View style={styles.buttonGroup}>
            <GoogleButton
              title="Continue with Google"
              isLoading={isGoogleLoading}
              onPress={onGoogleSignIn}
              disabled={isGoogleLoading}
            />
          </View>

          <View style={styles.legalContainer}>
            <ThemedText style={[styles.legalText, { color: mutedTextColor }]}>
              By continuing, you agree to our{' '}
              <ThemedText
                onPress={onTermsPress}
                style={[styles.legalLink, { color: BrandColors.accent }]}
              >
                Terms of service
              </ThemedText>
              {'\n and '}
              <ThemedText
                onPress={onPrivacyPress}
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'space-between',

    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  heroWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  logo: {
    width: 100,
    height: 100,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
    gap: Spacing.four,
  },
  textGroup: {
    gap: Spacing.one,
    alignItems: 'center',
  },
  mainTitle: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    paddingTop: Spacing.half,
  },
  legalContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  legalText: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  legalLink: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
