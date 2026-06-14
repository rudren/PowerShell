import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-open" size={40} color={COLORS.secondary} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'Check your email for the reset link'
            : "Enter your email and we'll send you a reset link"}
        </Text>
      </View>

      {!sent ? (
        <View style={[styles.card, SHADOWS.medium]}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.midGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.midGray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, SHADOWS.medium, { alignItems: 'center' }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
          </View>
          <Text style={styles.successText}>Email Sent!</Text>
          <Text style={styles.successSub}>Please check your inbox and follow the instructions to reset your password.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, padding: SPACING.xl },
  backBtn: { marginBottom: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.offWhite,
    height: 52,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.dark },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  successIcon: { marginBottom: SPACING.md },
  successText: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  successSub: { fontSize: FONTS.sizes.md, color: COLORS.darkGray, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 22 },
});
