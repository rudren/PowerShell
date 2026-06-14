import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { logoutUser, updateUserProfile } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function ParentProfile() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required.'); return; }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name, phone });
      updateUser({ name, phone });
      setEditing(false);
      Alert.alert('Updated', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logoutUser },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, SHADOWS.medium]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'P')[0].toUpperCase()}</Text>
          </View>
          {!editing ? (
            <>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
              <View style={styles.roleBadge}>
                <Ionicons name="people" size={14} color={COLORS.primary} />
                <Text style={styles.roleText}>Parent / Guardian</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
              />
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+601X-XXXXXXX"
                keyboardType="phone-pad"
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>{user?.email}</Text>
          </View>
          <View style={styles.settingRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Account Type</Text>
            <Text style={styles.settingValue}>Parent</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, SHADOWS.small]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Masai United FC App v1.0.0</Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  content: { padding: SPACING.lg },
  profileCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: 36, fontWeight: '900', color: COLORS.white },
  name: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  email: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: 4 },
  phone: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: SPACING.sm },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '18', paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.round, marginBottom: SPACING.md },
  roleText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.primary },
  editBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700' },
  formLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6, alignSelf: 'flex-start', width: '100%', marginTop: SPACING.sm },
  formInput: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.dark, backgroundColor: COLORS.offWhite, height: 46, width: '100%', marginBottom: SPACING.xs },
  editActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, width: '100%' },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.darkGray },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  settingLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.dark },
  settingValue: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.white, borderRadius: RADIUS.md, height: 52, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: COLORS.danger + '44' },
  logoutText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.danger },
  versionInfo: { alignItems: 'center' },
  versionText: { fontSize: FONTS.sizes.sm, color: COLORS.midGray },
});
