import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPaymentStatusColor, getPaymentStatusLabel } from '../../utils/helpers';
import { FONTS, SPACING, RADIUS } from '../../utils/theme';

export default function PaymentStatusBadge({ status }) {
  const color = getPaymentStatusColor(status);
  const label = getPaymentStatusLabel(status);

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  text: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
});
