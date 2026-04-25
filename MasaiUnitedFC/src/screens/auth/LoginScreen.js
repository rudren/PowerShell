import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CLUB_INFO } from '../../utils/constants';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');

  const roles = [
    { key: 'admin', label: 'Admin', icon: 'shield-checkmark' },
    { key: 'coach', label: 'Coach', icon: 'football' },
    { key: 'parent', label: 'Parent', icon: 'people' },
  ];

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>MUFC</Text>
          </View>
        </View>
        <Text style={styles.clubName}>{CLUB_INFO.name}</Text>
        <Text style={styles.clubTagline}>Player Management System</Text>
      </View>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, SHADOWS.medium]}>
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>Sign in to continue</Text>

          <View style={styles.roleSelector}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[styles.roleBtn, selectedRole === role.key && styles.roleBtnActive]}
                onPress={() => setSelectedRole(role.key)}
              >
                <Ionicons
                  name={role.icon}
                  size={18}
                  color={selectedRole === role.key ? COLORS.white : COLORS.darkGray}
                />
                <Text style={[styles.roleBtnText, selectedRole === role.key && styles.roleBtnTextActive]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.midGray} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={COLORS.midGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.midGray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {CLUB_INFO.name} © {CLUB_INFO.founded}
          </Text>
          <Text style={styles.footerSub}>All rights reserved</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: { marginBottom: SPACING.md },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  logoText: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.primary },
  clubName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
  },
  clubTagline: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  formContainer: { flex: 1 },
  formContent: { padding: SPACING.xl, paddingTop: 0 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  loginTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  loginSubtitle: { fontSize: FONTS.sizes.md, color: COLORS.darkGray, marginBottom: SPACING.lg },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  roleBtnActive: { backgroundColor: COLORS.primary },
  roleBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  roleBtnTextActive: { color: COLORS.white },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.offWhite,
    height: 52,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    height: '100%',
  },
  eyeBtn: { padding: SPACING.xs },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.lg },
  forgotText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  footer: { alignItems: 'center', paddingBottom: SPACING.xl },
  footerText: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  footerSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});
