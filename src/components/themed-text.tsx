import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'largeTitle'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'bodyLarge'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'button'
    | 'label'
    | 'input'
    | 'title' // alias for largeTitle
    | 'subtitle' // alias for h2
    | 'default' // alias for bodyLarge
    | 'small' // alias for bodySmall
    | 'smallBold'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'largeTitle' && styles.largeTitle,
        type === 'title' && styles.largeTitle,
        type === 'h1' && styles.h1,
        type === 'h2' && styles.h2,
        type === 'subtitle' && styles.h2,
        type === 'h3' && styles.h3,
        type === 'h4' && styles.h4,
        type === 'bodyLarge' && styles.bodyLarge,
        type === 'default' && styles.bodyLarge,
        type === 'body' && styles.body,
        type === 'bodySmall' && styles.bodySmall,
        type === 'small' && styles.bodySmall,
        type === 'smallBold' && styles.smallBold,
        type === 'caption' && styles.caption,
        type === 'button' && styles.button,
        type === 'label' && styles.label,
        type === 'input' && styles.input,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  largeTitle: {
    ...Typography.largeTitle,
  },
  h1: {
    ...Typography.h1,
  },
  h2: {
    ...Typography.h2,
  },
  h3: {
    ...Typography.h3,
  },
  h4: {
    ...Typography.h4,
  },
  bodyLarge: {
    ...Typography.bodyLarge,
  },
  body: {
    ...Typography.body,
  },
  bodySmall: {
    ...Typography.bodySmall,
  },
  smallBold: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  caption: {
    ...Typography.caption,
  },
  button: {
    ...Typography.button,
  },
  label: {
    ...Typography.label,
  },
  input: {
    ...Typography.input,
  },
  link: {
    ...Typography.body,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    ...Typography.body,
    color: '#133476',
    fontWeight: '600',
  },
  code: {
    fontFamily: Fonts?.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});

