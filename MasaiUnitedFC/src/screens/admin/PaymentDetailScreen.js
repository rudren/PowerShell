import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FIREBASE_COLLECTIONS, PAYMENT_STATUS } from '../../utils/constants';
import { sendPaymentReminder, sendPaymentConfirmation, incrementReminderCount } from '../../services/notificationService';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';

export default function PaymentDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState(null);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.INVOICES, invoiceId));
        if (snap.exists()) {
          const inv = { id: snap.id, ...snap.data() };
          setInvoice(inv);
          if (inv.parentId) {
            const parentSnap = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, inv.parentId));
            if (parentSnap.exists()) setParent(parentSnap.data());
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!invoice) return null;

  const handleRemind = async () => {
    const phone = parent?.phone || invoice.parentPhone;
    if (!phone) { Alert.alert('No Contact', 'Parent phone not available.'); return; }
    await sendPaymentReminder(phone, invoice.playerName, invoice.amount, invoice.monthLabel, formatDate(invoice.dueDate?.toDate?.() || new Date()));
    await incrementReminderCount(invoiceId);
    Alert.alert('Sent', 'WhatsApp reminder opened!');
  };

  const handleConfirm = async () => {
    const phone = parent?.phone || invoice.parentPhone;
    if (!phone) { Alert.alert('No Contact', 'Parent phone not available.'); return; }
    if (!invoice.receiptNo) { Alert.alert('Note', 'Record payment first to get receipt number.'); return; }
    await sendPaymentConfirmation(phone, invoice.playerName, invoice.paidAmount, invoice.monthLabel, invoice.receiptNo);
    Alert.alert('Sent', 'WhatsApp confirmation opened!');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Invoice Details"
        onBack={() => navigation.goBack()}
        rightIcon={invoice.status !== PAYMENT_STATUS.PAID ? 'cash' : undefined}
        onRightPress={() => navigation.navigate('RecordPayment', { invoiceId, invoice })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.invoiceHeader, SHADOWS.medium]}>
          <View style={styles.invoiceHeaderTop}>
            <View style={styles.clubLogo}>
              <Text style={styles.clubLogoText}>MUFC</Text>
            </View>
            <View>
              <Text style={styles.clubName}>Masai United FC</Text>
              <Text style={styles.invoiceLabel}>INVOICE</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Invoice No.</Text>
            <Text style={styles.invoiceVal}>{invoice.invoiceNo}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Player</Text>
            <Text style={styles.invoiceVal}>{invoice.playerName}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Category</Text>
            <Text style={styles.invoiceVal}>{invoice.category}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Month</Text>
            <Text style={styles.invoiceVal}>{invoice.monthLabel}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Due Date</Text>
            <Text style={styles.invoiceVal}>{formatDate(invoice.dueDate?.toDate?.() || invoice.dueDate)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Total Amount</Text>
            <Text style={[styles.invoiceVal, styles.amountText]}>{formatCurrency(invoice.amount)}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Paid</Text>
            <Text style={[styles.invoiceVal, { color: COLORS.success, fontWeight: '700' }]}>{formatCurrency(invoice.paidAmount || 0)}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Balance</Text>
            <Text style={[styles.invoiceVal, { color: COLORS.danger, fontWeight: '700' }]}>{formatCurrency(invoice.balance || invoice.amount)}</Text>
          </View>
          <View style={[styles.invoiceRow, { marginTop: SPACING.sm }]}>
            <Text style={styles.invoiceKey}>Status</Text>
            <PaymentStatusBadge status={invoice.status} />
          </View>
          {invoice.receiptNo && (
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceKey}>Receipt No.</Text>
              <Text style={styles.invoiceVal}>{invoice.receiptNo}</Text>
            </View>
          )}
          {invoice.remindersSent > 0 && (
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceKey}>Reminders Sent</Text>
              <Text style={styles.invoiceVal}>{invoice.remindersSent}</Text>
            </View>
          )}
        </View>

        {parent && (
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Parent / Guardian</Text>
            <Text style={styles.infoText}>{parent.name}</Text>
            <Text style={styles.infoText}>{parent.phone}</Text>
            <Text style={styles.infoText}>{parent.email}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          {invoice.status !== PAYMENT_STATUS.PAID && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => navigation.navigate('RecordPayment', { invoiceId, invoice })}
            >
              <Ionicons name="cash" size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Record Payment</Text>
            </TouchableOpacity>
          )}

          {invoice.status !== PAYMENT_STATUS.PAID && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={handleRemind}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Send Reminder</Text>
            </TouchableOpacity>
          )}

          {invoice.status === PAYMENT_STATUS.PAID && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={handleConfirm}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Send Confirmation</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]}
            onPress={() => navigation.navigate('Invoice', { invoiceId, invoice })}
          >
            <Ionicons name="document-text" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>View Invoice</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  invoiceHeader: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  invoiceHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  clubLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  clubLogoText: { fontSize: FONTS.sizes.sm, fontWeight: '900', color: COLORS.secondary },
  clubName: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark },
  invoiceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.md },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  invoiceKey: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '500' },
  invoiceVal: { fontSize: FONTS.sizes.md, color: COLORS.dark, fontWeight: '600' },
  amountText: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  infoText: { fontSize: FONTS.sizes.md, color: COLORS.darkGray, marginBottom: 4 },
  actionsRow: { gap: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, height: 50 },
  actionBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
});
