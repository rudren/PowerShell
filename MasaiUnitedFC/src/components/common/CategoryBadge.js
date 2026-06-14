import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CATEGORY_COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

export default function CategoryBadge({ category, size = 'md' }) {
  const color = CATEGORY_COLORS[category] || '#607D8B';
  const small = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }, small && styles.small]}>
      <Text style={[styles.text, { color }, small && styles.smallText]}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: SPACING.xs, paddingVertical: 1 },
  text: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  smallText: { fontSize: FONTS.sizes.xs },
});
