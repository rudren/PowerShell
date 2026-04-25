import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { recordPayment } from '../../services/paymentService';
import { sendPaymentConfirmation } from '../../services/notificationService';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Online Banking', 'eWallet (Touch n Go)', 'eWallet (GrabPay)', 'Cheque'];

export default function RecordPaymentScreen({ route, navigation }) {
  const { invoiceId, invoice } = route.params;
  const { user } = useAuth();
  const [amount, setAmount] = useState(invoice.balance?.toString() || invoice.amount?.toString() || '');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const handleRecord = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Enter a valid payment amount.');
      return;
    }
    if (numAmount > invoice.amount) {
      Alert.alert('Error', `Amount cannot exceed ${formatCurrency(invoice.amount)}.`);
      return;
    }

    setLoading(true);
    try {
      const result = await recordPayment(invoiceId, {
        amount: numAmount,
        method: method.toLowerCase().replace(/ /g, '_'),
        reference,
        notes,
        recordedBy: user?.uid,
      });

      if (sendWhatsApp && invoice.parentPhone) {
        await sendPaymentConfirmation(
          invoice.parentPhone,
          invoice.playerName,
          numAmount,
          invoice.monthLabel,
          result.receiptNo
        );
      }

      Alert.alert('Payment Recorded!', `Receipt: ${result.receiptNo}`, [
        { text: 'OK', onPress: () => navigation.pop(2) },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Record Payment" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.invoiceSummary, SHADOWS.small]}>
          <Text style={styles.playerName}>{invoice.playerName}</Text>
          <Text style={styles.monthLabel}>{invoice.monthLabel} • {invoice.category}</Text>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Invoice Total</Text>
              <Text style={styles.amountValue}>{formatCurrency(invoice.amount)}</Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Already Paid</Text>
              <Text style={[styles.amountValue, { color: COLORS.success }]}>{formatCurrency(invoice.paidAmount || 0)}</Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Balance</Text>
              <Text style={[styles.amountValue, { color: COLORS.danger }]}>{formatCurrency(invoice.balance || invoice.amount)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <Text style={styles.fieldLabel}>Amount Received (RM) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
          />

          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Reference / Receipt No.</Text>
          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={setReference}
            placeholder="Transaction reference (optional)"
          />

          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
          />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setSendWhatsApp(!sendWhatsApp)}
          >
            <View style={[styles.toggle, sendWhatsApp && styles.toggleActive]}>
              {sendWhatsApp && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Send WhatsApp Confirmation</Text>
              <Text style={styles.toggleSub}>Notify parent via WhatsApp after payment</Text>
            </View>
            <Ionicons name="logo-whatsapp" size={20} color={COLORS.success} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.recordBtn, loading && { opacity: 0.7 }]}
          onPress={handleRecord}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.recordBtnText}>Confirm Payment</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  invoiceSummary: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  playerName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  monthLabel: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.md },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)' },
  amountValue: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.white },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6, marginTop: SPACING.sm },
  input: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.dark, backgroundColor: COLORS.offWhite, height: 46 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  methodBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.lightGray, backgroundColor: COLORS.offWhite },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  methodTextActive: { color: COLORS.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  toggle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  toggleActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  toggleLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  toggleSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  recordBtn: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOWS.medium },
  recordBtnText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
});
