import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { useRouter } from 'expo-router';

export default function LoginRoute() {
  const router = useRouter();

  const onTermsPress = () => router.push('/terms');
  const onPrivacyPress = () => router.push('/privacy');

  return <LoginScreen onTermsPress={onTermsPress} onPrivacyPress={onPrivacyPress} />;
}
