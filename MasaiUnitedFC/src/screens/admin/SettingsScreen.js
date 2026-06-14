import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/authService';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CLUB_INFO } from '../../utils/constants';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const [monthlyFee, setMonthlyFee] = useState('80');
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logoutUser() },
    ]);
  };

  const sections = [
    {
      title: 'Club Information',
      items: [
        { label: 'Club Name', value: CLUB_INFO.name, icon: 'shield' },
        { label: 'Short Name', value: CLUB_INFO.shortName, icon: 'text' },
        { label: 'Founded', value: CLUB_INFO.founded.toString(), icon: 'calendar' },
        { label: 'Email', value: CLUB_INFO.email, icon: 'mail' },
        { label: 'Phone', value: CLUB_INFO.phone, icon: 'call' },
      ],
    },
    {
      title: 'Payment Settings',
      items: [
        { label: 'Bank Name', value: CLUB_INFO.bankName, icon: 'business' },
        { label: 'Account No.', value: CLUB_INFO.bankAccount, icon: 'card' },
        { label: 'Account Name', value: CLUB_INFO.bankAccountName, icon: 'person' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, SHADOWS.medium]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.name?.[0] || 'A'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>Administrator</Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, idx) => (
              <View key={item.label} style={[styles.settingRow, idx < section.items.length - 1 && styles.settingBorder]}>
                <View style={styles.settingLeft}>
                  <Ionicons name={`${item.icon}-outline`} size={18} color={COLORS.primary} />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <Text style={styles.settingValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, notifEnabled && styles.toggleOn]}
              onPress={() => setNotifEnabled(!notifEnabled)}
            >
              <View style={[styles.toggleThumb, notifEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, SHADOWS.small]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Masai United FC App v1.0.0</Text>
          <Text style={styles.versionSub}>© 2007 Masai United FC. All rights reserved.</Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  profileCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  profileAvatarText: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: COLORS.primary },
  profileName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  profileEmail: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.sm },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.round },
  roleText: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '700' },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  settingLabel: { fontSize: FONTS.sizes.md, color: COLORS.dark },
  settingValue: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, maxWidth: 160, textAlign: 'right' },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: COLORS.lightGray, padding: 3 },
  toggleOn: { backgroundColor: COLORS.success },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.white, borderRadius: RADIUS.md, height: 52, marginBottom: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.danger + '44' },
  logoutText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.danger },
  versionInfo: { alignItems: 'center' },
  versionText: { fontSize: FONTS.sizes.sm, color: COLORS.midGray, fontWeight: '600' },
  versionSub: { fontSize: FONTS.sizes.xs, color: COLORS.lightGray, marginTop: 4 },
});
