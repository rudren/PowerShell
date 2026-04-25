import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllInvoices, createInvoice, getPaymentSummary } from '../../services/paymentService';
import { getAllPlayers } from '../../services/playerService';
import { sendPaymentReminder, incrementReminderCount } from '../../services/notificationService';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import CategoryBadge from '../../components/common/CategoryBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { PAYMENT_STATUS, PLAYER_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import moment from 'moment';

export default function PaymentManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear] = useState(moment().year());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [fee, setFee] = useState('');
  const [dueDate, setDueDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, summaryData] = await Promise.all([
        getAllInvoices(selectedMonth, selectedYear),
        getPaymentSummary(selectedMonth, selectedYear),
      ]);
      setInvoices(invData);
      setSummary(summaryData);
    } catch (err) {
      Alert.alert('Error', 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { load(); }, [load]);

  const filteredInvoices = filterStatus === 'all'
    ? invoices
    : invoices.filter((i) => i.status === filterStatus);

  const handleSendReminder = async (invoice) => {
    if (!invoice.parentPhone && !invoice.playerName) {
      Alert.alert('No Contact', 'Parent phone not available.');
      return;
    }
    try {
      await sendPaymentReminder(
        invoice.parentPhone || '',
        invoice.playerName,
        invoice.amount,
        invoice.monthLabel,
        formatDate(invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date())
      );
      await incrementReminderCount(invoice.id);
      load();
    } catch (err) {
      Alert.alert('Error', 'Failed to send reminder.');
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedPlayer) { Alert.alert('Error', 'Select a player.'); return; }
    if (!fee) { Alert.alert('Error', 'Enter fee amount.'); return; }
    setCreating(true);
    try {
      await createInvoice(
        selectedPlayer.id,
        selectedPlayer.fullName,
        selectedPlayer.parentId || '',
        selectedPlayer.category,
        selectedMonth,
        selectedYear,
        parseFloat(fee),
        dueDate
      );
      setShowCreateModal(false);
      load();
      Alert.alert('Success', 'Invoice created!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const loadPlayers = async () => {
    const data = await getAllPlayers(true);
    setPlayers(data);
    setShowCreateModal(true);
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const renderInvoice = ({ item }) => (
    <TouchableOpacity
      style={[styles.invoiceCard, SHADOWS.small]}
      onPress={() => navigation.navigate('PaymentDetail', { invoiceId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.invoiceLeft}>
        <View style={styles.invoiceAvatar}>
          <Text style={styles.avatarText}>{item.playerName?.[0] || '?'}</Text>
        </View>
        <View>
          <Text style={styles.playerName}>{item.playerName}</Text>
          <CategoryBadge category={item.category} size="sm" />
          <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
        </View>
      </View>
      <View style={styles.invoiceRight}>
        <Text style={styles.invoiceAmount}>{formatCurrency(item.amount)}</Text>
        <PaymentStatusBadge status={item.status} />
        {item.status !== PAYMENT_STATUS.PAID && (
          <TouchableOpacity
            style={styles.reminderBtn}
            onPress={() => handleSendReminder(item)}
          >
            <Ionicons name="logo-whatsapp" size={14} color={COLORS.success} />
            <Text style={styles.reminderText}>Remind</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={loadPlayers}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
        {months.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.monthBtn, selectedMonth === m && styles.monthBtnActive]}
            onPress={() => setSelectedMonth(m)}
          >
            <Text style={[styles.monthText, selectedMonth === m && styles.monthTextActive]}>
              {moment(`${selectedYear}-${m}`, 'YYYY-M').format('MMM')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.summaryRow}>
        <SummaryBox label="Paid" value={summary.paid || 0} color={COLORS.success} />
        <SummaryBox label="Unpaid" value={(summary.unpaid || 0) + (summary.partial || 0)} color={COLORS.danger} />
        <SummaryBox label="Collected" value={`${summary.collectionRate || 0}%`} color={COLORS.primary} />
        <SummaryBox label="Total" value={formatCurrency(summary.paidAmount || 0)} color={COLORS.info} small />
      </View>

      <View style={styles.filterRow}>
        {[['all', 'All'], ['paid', 'Paid'], ['unpaid', 'Unpaid'], ['partial', 'Partial']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, filterStatus === key && styles.filterBtnActive]}
            onPress={() => setFilterStatus(key)}
          >
            <Text style={[styles.filterText, filterStatus === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={renderInvoice}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No payments found</Text>
            </View>
          )}
        />
      )}

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Invoice</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.formLabel}>Select Player</Text>
            {players.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.playerOption, selectedPlayer?.id === p.id && styles.playerOptionActive]}
                onPress={() => { setSelectedPlayer(p); setFee(p.monthlyFee?.toString() || ''); }}
              >
                <Text style={[styles.playerOptionName, selectedPlayer?.id === p.id && { color: COLORS.white }]}>{p.fullName}</Text>
                <CategoryBadge category={p.category} size="sm" />
              </TouchableOpacity>
            ))}

            <Text style={styles.formLabel}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                {months.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthBtn, selectedMonth === m && styles.monthBtnActive]}
                    onPress={() => setSelectedMonth(m)}
                  >
                    <Text style={[styles.monthText, selectedMonth === m && styles.monthTextActive]}>
                      {moment(`${selectedYear}-${m}`, 'YYYY-M').format('MMM')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.formLabel}>Fee Amount (RM)</Text>
            <TextInput
              style={styles.formInput}
              value={fee}
              onChangeText={setFee}
              keyboardType="numeric"
              placeholder="80.00"
            />

            <Text style={styles.formLabel}>Due Date</Text>
            <TextInput
              style={styles.formInput}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
            />

            <TouchableOpacity
              style={[styles.createBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreateInvoice}
              disabled={creating}
            >
              {creating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.createBtnText}>Create Invoice</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const SummaryBox = ({ label, value, color, small }) => (
  <View style={[styles.summaryBox, SHADOWS.small]}>
    <Text style={[styles.summaryValue, { color, fontSize: small ? FONTS.sizes.sm : FONTS.sizes.lg }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  monthScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  monthBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  monthBtnActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  monthTextActive: { color: COLORS.white },
  summaryRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  summaryBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  summaryValue: { fontWeight: '800', color: COLORS.dark },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.md },
  invoiceCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.sm },
  invoiceLeft: { flexDirection: 'row', gap: SPACING.sm, flex: 1 },
  invoiceAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  playerName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  invoiceNo: { fontSize: FONTS.sizes.xs, color: COLORS.midGray, marginTop: 4 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  reminderText: { fontSize: FONTS.sizes.xs, color: COLORS.success, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginTop: SPACING.md },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  modalContent: { padding: SPACING.lg },
  formLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6, marginTop: SPACING.sm },
  formInput: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.dark, height: 46, marginBottom: SPACING.sm },
  playerOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: SPACING.xs },
  playerOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  playerOptionName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.dark },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
});
