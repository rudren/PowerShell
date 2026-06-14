import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  getPendingPlayers, getUpdateRequests,
  approvePendingPlayer, rejectPendingPlayer,
  approveUpdateRequest, rejectUpdateRequest,
  notifyApproval, notifyRejection,
} from '../../services/pendingService';
import Header from '../../components/common/Header';
import CategoryBadge from '../../components/common/CategoryBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatDateTime } from '../../utils/helpers';

export default function PendingApprovalsScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new');
  const [pending, setPending]     = useState([]);
  const [updates, setUpdates]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, u] = await Promise.all([getPendingPlayers(), getUpdateRequests()]);
    setPending(p);
    setUpdates(u);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = activeTab === 'new' ? pending : updates;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleApprove = (item) => {
    const label = activeTab === 'new' ? 'register' : 'update';
    Alert.alert(
      'Approve?',
      `${label.charAt(0).toUpperCase() + label.slice(1)} ${item.playerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActing(true);
            try {
              if (activeTab === 'new') {
                await approvePendingPlayer(item.id, item, user.uid);
              } else {
                await approveUpdateRequest(item.id, item, user.uid);
              }
              if (item.parentPhone) {
                await notifyApproval(item.parentPhone, item.playerName);
              }
              setSelected(null);
              load();
              Alert.alert('Approved!', `${item.playerName} has been ${label}d.`);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }
    Alert.alert('Reject?', `Reject ${selected?.playerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActing(true);
          try {
            if (activeTab === 'new') {
              await rejectPendingPlayer(selected.id, rejectReason, user.uid);
            } else {
              await rejectUpdateRequest(selected.id, rejectReason, user.uid);
            }
            if (selected.parentPhone) {
              await notifyRejection(selected.parentPhone, selected.playerName, rejectReason);
            }
            setRejectModal(false);
            setSelected(null);
            setRejectReason('');
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  // ── Detail modal ───────────────────────────────────────────────────────────

  const renderDetail = () => {
    if (!selected) return null;
    const isUpdate = activeTab === 'update';

    const fields = [
      { label: 'Player Name',       value: selected.playerName },
      { label: 'Date of Birth',     value: selected.dob },
      { label: 'Category',          value: selected.category },
      { label: 'Position',          value: selected.position },
      { label: 'Jersey No.',        value: selected.jerseyNumber },
      { label: 'School',            value: selected.school },
      { label: 'Parent Name',       value: selected.parentName },
      { label: 'Parent Phone',      value: selected.parentPhone },
      { label: 'Parent Email',      value: selected.parentEmail },
      { label: 'Address',           value: selected.address },
      { label: 'Emergency Contact', value: selected.emergencyContact },
      { label: 'Emergency Phone',   value: selected.emergencyPhone },
      { label: 'Medical Notes',     value: selected.medicalNotes },
      { label: 'Monthly Fee',       value: selected.monthlyFee ? `RM ${selected.monthlyFee}` : null },
      { label: 'Submitted',         value: formatDateTime(selected.createdAt) },
      { label: 'Source',            value: selected.source },
    ];

    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selected.playerName}</Text>
              <Text style={styles.modalSub}>{isUpdate ? 'Update Request' : 'New Registration'} from Google Form</Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {selected.category && (
              <View style={{ marginBottom: SPACING.md }}>
                <CategoryBadge category={selected.category} />
              </View>
            )}

            <View style={styles.detailCard}>
              {fields.map(({ label, value }) =>
                value ? (
                  <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{label}</Text>
                    <Text style={styles.detailVal}>{value}</Text>
                  </View>
                ) : null
              )}
            </View>

            {isUpdate && selected.existingPlayerId && (
              <View style={styles.updateNote}>
                <Ionicons name="information-circle" size={16} color={COLORS.info} />
                <Text style={styles.updateNoteText}>
                  This will update player ID: {selected.existingPlayerId}
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.rejectBtn, acting && { opacity: 0.6 }]}
                onPress={() => setRejectModal(true)}
                disabled={acting}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.approveBtn, acting && { opacity: 0.6 }]}
                onPress={() => handleApprove(selected)}
                disabled={acting}
              >
                {acting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Reject reason modal */}
        <Modal visible={rejectModal} transparent animationType="fade">
          <View style={styles.rejectOverlay}>
            <View style={styles.rejectDialog}>
              <Text style={styles.rejectDialogTitle}>Reason for Rejection</Text>
              <TextInput
                style={styles.rejectInput}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="e.g. Incomplete information, wrong category..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.rejectDialogRow}>
                <TouchableOpacity
                  style={styles.rejectDialogCancel}
                  onPress={() => { setRejectModal(false); setRejectReason(''); }}
                >
                  <Text style={styles.rejectDialogCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectDialogConfirm} onPress={handleReject}>
                  <Text style={styles.rejectDialogConfirmText}>Confirm Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>
    );
  };

  // ── Card ───────────────────────────────────────────────────────────────────

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, SHADOWS.small]}
      onPress={() => setSelected(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarText}>{item.playerName?.[0] || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.playerName}</Text>
          <Text style={styles.cardSub}>{item.parentName} • {item.parentPhone}</Text>
          <View style={styles.cardRow}>
            {item.category ? <CategoryBadge category={item.category} size="sm" /> : null}
            <View style={styles.sourcePill}>
              <Ionicons name="logo-google" size={10} color={COLORS.info} />
              <Text style={styles.sourceText}>Google Form</Text>
            </View>
          </View>
          <Text style={styles.cardDate}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.midGray} />
    </TouchableOpacity>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Header title="Pending Approvals" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
        >
          <Ionicons name="person-add" size={16} color={activeTab === 'new' ? COLORS.white : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            New ({pending.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'update' && styles.tabActive]}
          onPress={() => setActiveTab('update')}
        >
          <Ionicons name="create" size={16} color={activeTab === 'update' ? COLORS.white : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'update' && styles.tabTextActive]}>
            Updates ({updates.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : list.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={72} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>All clear!</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'new'
              ? 'No new registrations pending'
              : 'No update requests pending'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          onRefresh={load}
          refreshing={loading}
        />
      )}

      {renderDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: {
    flexDirection: 'row',
    margin: SPACING.lg,
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.darkGray },
  tabTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: 0 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  cardName: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  cardSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginBottom: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.info + '18',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  sourceText: { fontSize: 9, color: COLORS.info, fontWeight: '700' },
  cardDate: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark, marginTop: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.midGray, textAlign: 'center', marginTop: SPACING.sm },

  // Modal
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  modalSub: { fontSize: FONTS.sizes.xs, color: COLORS.info, fontWeight: '600', marginTop: 2 },
  modalContent: { padding: SPACING.lg },
  detailCard: {
    backgroundColor: COLORS.offWhite,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailKey: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, flex: 1 },
  detailVal: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.dark, flex: 1.5, textAlign: 'right' },
  updateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.info + '18',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  updateNoteText: { fontSize: FONTS.sizes.xs, color: COLORS.info, flex: 1 },
  actionRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  rejectBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.danger },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
    height: 52,
    backgroundColor: COLORS.success,
  },
  approveBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },

  // Reject dialog
  rejectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  rejectDialog: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg },
  rejectDialogTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  rejectInput: {
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    height: 100,
    backgroundColor: COLORS.offWhite,
    marginBottom: SPACING.md,
  },
  rejectDialogRow: { flexDirection: 'row', gap: SPACING.sm },
  rejectDialogCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectDialogCancelText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.darkGray },
  rejectDialogConfirm: {
    flex: 2,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectDialogConfirmText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
});
