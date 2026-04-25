import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../../utils/theme';

export default function StatCard({ icon, label, value, color = COLORS.primary, onPress, trend, trendValue }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, SHADOWS.small]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend !== undefined && (
        <View style={styles.trendRow}>
          <Ionicons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend >= 0 ? COLORS.success : COLORS.danger}
          />
          <Text style={[styles.trend, { color: trend >= 0 ? COLORS.success : COLORS.danger }]}>
            {' '}{Math.abs(trendValue || trend)}%
          </Text>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    margin: SPACING.xs,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  trend: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
});
