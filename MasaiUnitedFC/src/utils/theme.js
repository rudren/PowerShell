import { DefaultTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#C41E3A',
  primaryDark: '#8B0000',
  primaryLight: '#E8566A',
  secondary: '#FFD700',
  secondaryDark: '#B8960C',
  dark: '#1A1A2E',
  darkCard: '#16213E',
  darkMid: '#0F3460',
  white: '#FFFFFF',
  offWhite: '#F8F9FA',
  lightGray: '#E9ECEF',
  midGray: '#ADB5BD',
  darkGray: '#495057',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  info: '#17A2B8',
  paid: '#28A745',
  unpaid: '#DC3545',
  partial: '#FFC107',
  background: '#F0F2F5',
  cardBg: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.12)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  round: 50,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.white,
    text: COLORS.dark,
    placeholder: COLORS.midGray,
  },
};

export const CATEGORY_COLORS = {
  U8: '#4CAF50',
  U10: '#2196F3',
  U12: '#9C27B0',
  U15: '#FF5722',
  U18: '#FF9800',
};
