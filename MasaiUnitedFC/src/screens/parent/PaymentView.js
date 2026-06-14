import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getParentInvoices } from '../../services/paymentService';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import CategoryBadge from '../../components/common/CategoryBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PAYMENT_STATUS } from '../../utils/constants';

export default function PaymentView({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getParentInvoices(user?.uid);
      setInvoices(data);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  const totalOwed = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.balance || i.amount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.headerSub}>Manage your payment history</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.success }, SHADOWS.small]}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatCurrency(totalPaid)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.danger }, SHADOWS.small]}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{formatCurrency(totalOwed)}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {[['all', 'All'], ['paid', 'Paid'], ['unpaid', 'Unpaid'], ['partial', 'Partial']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.invoiceCard, SHADOWS.small]}
              onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
              activeOpacity={0.85}
            >
              <View style={styles.invoiceLeft}>
                <View style={styles.invoiceAvatar}>
                  <Text style={styles.invoiceAvatarText}>{item.playerName?.[0] || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.invoicePlayer}>{item.playerName}</Text>
                  <CategoryBadge category={item.category} size="sm" />
                  <Text style={styles.invoiceMonth}>{item.monthLabel}</Text>
                  <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
                </View>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>{formatCurrency(item.amount)}</Text>
                <PaymentStatusBadge status={item.status} />
                {item.status !== PAYMENT_STATUS.PAID && (
                  <Text style={styles.balanceText}>Balance: {formatCurrency(item.balance || item.amount)}</Text>
                )}
                {item.dueDate && (
                  <Text style={styles.dueText}>Due: {formatDate(item.dueDate?.toDate?.())}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  summaryRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, borderTopWidth: 4 },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginBottom: 4 },
  summaryValue: { fontSize: FONTS.sizes.xl, fontWeight: '800' },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.md },
  invoiceCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  invoiceLeft: { flexDirection: 'row', gap: SPACING.sm, flex: 1 },
  invoiceAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  invoiceAvatarText: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  invoicePlayer: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  invoiceMonth: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginTop: 4 },
  invoiceNo: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark },
  balanceText: { fontSize: FONTS.sizes.xs, color: COLORS.danger, fontWeight: '600' },
  dueText: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginTop: SPACING.md },
});
