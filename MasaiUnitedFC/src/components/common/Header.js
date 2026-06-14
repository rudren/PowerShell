import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../utils/theme';

export default function Header({ title, subtitle, onBack, rightIcon, onRightPress, dark = true }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + SPACING.sm },
      dark ? styles.dark : styles.light,
    ]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={dark ? COLORS.primary : COLORS.white} />
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.dark} />
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, dark ? styles.titleDark : styles.titleLight]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, dark ? styles.subtitleDark : styles.subtitleLight]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
            <Ionicons name={rightIcon} size={24} color={dark ? COLORS.white : COLORS.dark} />
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  dark: { backgroundColor: COLORS.primary },
  light: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  titleDark: { color: COLORS.white },
  titleLight: { color: COLORS.dark },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: 1 },
  subtitleDark: { color: 'rgba(255,255,255,0.8)' },
  subtitleLight: { color: COLORS.darkGray },
});
