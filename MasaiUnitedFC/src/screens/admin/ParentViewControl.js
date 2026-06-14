import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDocs, query, collection, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FIREBASE_COLLECTIONS, ROLES } from '../../utils/constants';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const PERMISSIONS = [
  { key: 'canViewDashboard', label: 'Dashboard', icon: 'grid', desc: 'Player overview and stats' },
  { key: 'canViewAttendance', label: 'Attendance', icon: 'calendar', desc: 'Attendance history' },
  { key: 'canViewPayments', label: 'Payments', icon: 'card', desc: 'Payment status & invoices' },
  { key: 'canViewProgress', label: 'Progress', icon: 'trending-up', desc: 'Player progress notes' },
];

export default function ParentViewControl({ navigation }) {
  const [parents, setParents] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    canViewDashboard: true,
    canViewAttendance: true,
    canViewPayments: true,
    canViewProgress: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.USERS),
      where('role', '==', ROLES.PARENT)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    setParents(data);
    setLoading(false);
  };

  const toggleGlobal = (key) => {
    setGlobalSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyToAll = async () => {
    Alert.alert(
      'Apply to All Parents',
      'This will update view permissions for ALL parent accounts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setSaving(true);
            try {
              await Promise.all(
                parents.map((p) =>
                  updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, p.uid), globalSettings)
                )
              );
              loadParents();
              Alert.alert('Done', 'Permissions updated for all parents!');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const toggleParentPermission = async (parentUid, key, currentValue) => {
    try {
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, parentUid), {
        [key]: !currentValue,
      });
      loadParents();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderParent = ({ item }) => (
    <View style={[styles.parentCard, SHADOWS.small]}>
      <View style={styles.parentHeader}>
        <View style={styles.parentAvatar}>
          <Text style={styles.parentAvatarText}>{item.name?.[0] || 'P'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.parentName}>{item.name}</Text>
          <Text style={styles.parentEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.permGrid}>
        {PERMISSIONS.map((perm) => (
          <TouchableOpacity
            key={perm.key}
            style={[styles.permToggle, item[perm.key] !== false && styles.permToggleOn]}
            onPress={() => toggleParentPermission(item.uid, perm.key, item[perm.key] !== false)}
          >
            <Ionicons
              name={perm.icon}
              size={14}
              color={item[perm.key] !== false ? COLORS.primary : COLORS.midGray}
            />
            <Text style={[styles.permToggleText, item[perm.key] !== false && styles.permToggleTextOn]}>
              {perm.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Parent View Control" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.globalCard, SHADOWS.medium]}>
          <Text style={styles.globalTitle}>Global Permission Settings</Text>
          <Text style={styles.globalSub}>Control what all parents can see in the app</Text>
          {PERMISSIONS.map((perm) => (
            <View key={perm.key} style={styles.globalPermRow}>
              <View style={[styles.permIcon, { backgroundColor: globalSettings[perm.key] ? COLORS.primary + '18' : COLORS.lightGray }]}>
                <Ionicons name={perm.icon} size={20} color={globalSettings[perm.key] ? COLORS.primary : COLORS.midGray} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.permLabel}>{perm.label}</Text>
                <Text style={styles.permDesc}>{perm.desc}</Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, globalSettings[perm.key] && styles.switchOn]}
                onPress={() => toggleGlobal(perm.key)}
              >
                <View style={[styles.switchThumb, globalSettings[perm.key] && styles.switchThumbOn]} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.applyBtn, saving && { opacity: 0.7 }]}
            onPress={applyToAll}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="people" size={18} color={COLORS.white} />
                <Text style={styles.applyBtnText}>Apply to All Parents</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Individual Parent Permissions</Text>
        <Text style={styles.sectionSub}>Tap permissions to toggle for individual parents</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          parents.map((parent) => (
            <View key={parent.uid}>
              {renderParent({ item: parent })}
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  globalCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  globalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  globalSub: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: SPACING.lg },
  globalPermRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  permIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  permLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  permDesc: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  switch: { width: 48, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray, padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: COLORS.primary },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white },
  switchThumbOn: { alignSelf: 'flex-end' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 48, marginTop: SPACING.lg },
  applyBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  sectionSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginBottom: SPACING.md },
  parentCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  parentHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  parentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  parentAvatarText: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },
  parentName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  parentEmail: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  permGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  permToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  permToggleOn: { backgroundColor: COLORS.primary + '18' },
  permToggleText: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, fontWeight: '600' },
  permToggleTextOn: { color: COLORS.primary },
});
