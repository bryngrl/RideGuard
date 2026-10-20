import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/modules/settings/store/settings.store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  const preference = useSettingsStore((state) => state.themePreference);

  if (hasHydrated) {
    return preference === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : preference;
  }

  return 'light';
}
