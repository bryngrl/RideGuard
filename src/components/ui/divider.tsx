import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface DividerProps {
  text?: string;
  style?: StyleProp<ViewStyle>;
  lineColor?: string;
  textColor?: string;
}

export function Divider({ text, style, lineColor, textColor }: DividerProps) {
  const theme = useTheme();
  const effectiveLineColor = lineColor ?? theme.border;
  const effectiveTextColor = textColor ?? theme.textMuted;

  if (!text) {
    return <View style={[styles.lineOnly, { backgroundColor: effectiveLineColor }, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.line, { backgroundColor: effectiveLineColor }]} />
      <Text style={[styles.text, { color: effectiveTextColor }]}>{text}</Text>
      <View style={[styles.line, { backgroundColor: effectiveLineColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: Spacing.four,
  },
  line: {
    flex: 1,
    height: 1,
  },
  lineOnly: {
    width: '100%',
    height: 1,
    marginVertical: Spacing.three,
  },
  text: {
    ...Typography.bodySmall,
    marginHorizontal: Spacing.three,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
});
