import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDocs, collection, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { createCoachAccount, createParentAccount } from '../../services/authService';
import { FIREBASE_COLLECTIONS, ROLES, PLAYER_CATEGORIES } from '../../utils/constants';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function UserManagement({ navigation }) {
  const [users, setUsers] = useState([]);
  const [activeRole, setActiveRole] = useState('coach');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'coach', categories: [] });
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = async (role = activeRole) => {
    setLoading(true);
    const q = query(collection(db, FIREBASE_COLLECTIONS.USERS), where('role', '==', role));
    const snap = await getDocs(q);
    setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { loadUsers(activeRole); }, [activeRole]);

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      Alert.alert('Error', 'Name, email and password are required.');
      return;
    }
    setCreating(true);
    try {
      if (newUser.role === 'coach') {
        await createCoachAccount(newUser.email, newUser.password, newUser.name, newUser.phone, newUser.categories);
      } else {
        await createParentAccount(newUser.email, newUser.password, newUser.name, newUser.phone, []);
      }
      setShowCreate(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: activeRole, categories: [] });
      loadUsers();
      Alert.alert('Success', `${newUser.role} account created!`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (uid, isActive) => {
    Alert.alert(
      isActive ? 'Deactivate Account' : 'Activate Account',
      `Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, uid), { isActive: !isActive });
            loadUsers();
          },
        },
      ]
    );
  };

  const toggleCategory = (cat) => {
    setNewUser((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userCard, SHADOWS.small]}>
      <View style={styles.userLeft}>
        <View style={[styles.userAvatar, !item.isActive && styles.userAvatarInactive]}>
          <Text style={styles.userAvatarText}>{item.name?.[0] || '?'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.categories?.length > 0 && (
            <Text style={styles.userCats}>Categories: {item.categories.join(', ')}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}
        onPress={() => toggleActive(item.uid, item.isActive)}
      >
        <Text style={[styles.statusText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="User Management" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        {['coach', 'parent'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.tab, activeRole === role && styles.tabActive]}
            onPress={() => setActiveRole(role)}
          >
            <Ionicons
              name={role === 'coach' ? 'football' : 'people'}
              size={16}
              color={activeRole === role ? COLORS.white : COLORS.darkGray}
            />
            <Text style={[styles.tabText, activeRole === role && styles.tabTextActive]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => { setNewUser({ ...newUser, role: activeRole, categories: [] }); setShowCreate(true); }}
      >
        <Ionicons name="person-add" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Add {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No {activeRole}s found</Text>
            </View>
          )}
        />
      )}

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Create {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)} Account
            </Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {[
              { label: 'Full Name *', key: 'name', placeholder: 'e.g. Ahmad bin Ali' },
              { label: 'Email Address *', key: 'email', placeholder: 'email@example.com', keyboard: 'email-address' },
              { label: 'Phone Number', key: 'phone', placeholder: '+601X-XXXXXXX', keyboard: 'phone-pad' },
              { label: 'Password *', key: 'password', placeholder: 'Minimum 6 characters', secure: true },
            ].map((field) => (
              <View key={field.key}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={styles.formInput}
                  value={newUser[field.key]}
                  onChangeText={(v) => setNewUser({ ...newUser, [field.key]: v })}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboard || 'default'}
                  secureTextEntry={field.secure}
                  autoCapitalize="none"
                />
              </View>
            ))}

            {newUser.role === 'coach' && (
              <>
                <Text style={styles.formLabel}>Assigned Categories</Text>
                <View style={styles.chipRow}>
                  {PLAYER_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, newUser.categories.includes(cat) && styles.chipActive]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <Text style={[styles.chipText, newUser.categories.includes(cat) && styles.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.createBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.createBtnText}>Create Account</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: { flexDirection: 'row', margin: SPACING.lg, backgroundColor: COLORS.lightGray, borderRadius: RADIUS.md, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.darkGray },
  tabTextActive: { color: COLORS.white },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, height: 44, marginBottom: SPACING.sm, ...SHADOWS.small },
  addBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: 0 },
  userCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  userLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  userAvatarInactive: { backgroundColor: COLORS.lightGray },
  userAvatarText: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  userName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  userEmail: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  userCats: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.round },
  statusActive: { backgroundColor: COLORS.success + '22' },
  statusInactive: { backgroundColor: COLORS.danger + '22' },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  statusActiveText: { color: COLORS.success },
  statusInactiveText: { color: COLORS.danger },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginTop: SPACING.md },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  modalContent: { padding: SPACING.lg },
  formLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6, marginTop: SPACING.sm },
  formInput: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.dark, backgroundColor: COLORS.offWhite, height: 46, marginBottom: SPACING.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.lightGray },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
});
