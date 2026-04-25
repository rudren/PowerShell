import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Header from '../../components/common/Header';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CLUB_INFO } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { openWhatsApp, sanitizePhone } from '../../utils/helpers';
import moment from 'moment';

export default function InvoiceDetailView({ route, navigation }) {
  const { invoice } = route.params;

  const generateHTML = () => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
  .header { background: #C41E3A; color: white; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; margin-bottom: 20px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .key { font-size: 13px; color: #666; } .val { font-size: 13px; font-weight: 600; }
  .total { background: #f8f8f8; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; margin-top: 12px; }
  .bank { background: #f0f0f0; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 12px; }
  .footer { text-align: center; margin-top: 24px; color: #999; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <div><b style="font-size:20px">${CLUB_INFO.name}</b><br><span style="opacity:0.8;letter-spacing:2px;font-size:13px">INVOICE</span></div>
    <div style="background:#FFD700;width:56px;height:56px;border-radius:28px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#C41E3A;font-size:13px;text-align:center;line-height:56px">MUFC</div>
  </div>
  <div class="row"><span class="key">Invoice No.</span><span class="val">${invoice.invoiceNo}</span></div>
  <div class="row"><span class="key">Player</span><span class="val">${invoice.playerName}</span></div>
  <div class="row"><span class="key">Category</span><span class="val">${invoice.category}</span></div>
  <div class="row"><span class="key">Period</span><span class="val">${invoice.monthLabel}</span></div>
  <div class="row"><span class="key">Status</span><span class="val">${invoice.status?.toUpperCase()}</span></div>
  <div class="row"><span class="key">Amount</span><span class="val">${formatCurrency(invoice.amount)}</span></div>
  <div class="row"><span class="key">Paid</span><span class="val" style="color:#28A745">${formatCurrency(invoice.paidAmount || 0)}</span></div>
  <div class="total"><span style="font-weight:700">Balance Due</span><span style="font-size:20px;font-weight:900;color:#C41E3A">${formatCurrency(invoice.balance || invoice.amount)}</span></div>
  ${invoice.status !== 'paid' ? `
  <div class="bank">
    <b>Payment via:</b><br>
    ${CLUB_INFO.bankName} | Acc: ${CLUB_INFO.bankAccount}<br>
    Name: ${CLUB_INFO.bankAccountName}<br>
    Ref: <b>${invoice.invoiceNo}</b>
  </div>` : `<div class="bank" style="background:#28A74511">✅ Payment Complete — Receipt: ${invoice.receiptNo || 'N/A'}</div>`}
  <div class="footer">${CLUB_INFO.name} | ${CLUB_INFO.email} | Est. ${CLUB_INFO.founded}</div>
</body>
</html>`;

  const handleWhatsApp = async () => {
    const message = `Salam, boleh saya tanya status bayaran Invoice ${invoice.invoiceNo} untuk ${invoice.playerName}? Jumlah: ${formatCurrency(invoice.amount)} (${invoice.monthLabel}). Terima kasih.`;
    await openWhatsApp(CLUB_INFO.phone || '+60', message);
  };

  const handleShare = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${invoice.invoiceNo}` });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Invoice" subtitle={invoice.invoiceNo} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.invoiceCard, SHADOWS.medium]}>
          <View style={styles.invoiceTop}>
            <View>
              <Text style={styles.clubName}>{CLUB_INFO.name}</Text>
              <Text style={styles.invoiceLabel}>INVOICE</Text>
            </View>
            <View style={styles.logo}><Text style={styles.logoText}>MUFC</Text></View>
          </View>

          <View style={styles.divider} />
          <Row label="Invoice No." value={invoice.invoiceNo} />
          <Row label="Player" value={invoice.playerName} />
          <Row label="Category" value={invoice.category} />
          <Row label="Period" value={invoice.monthLabel} />
          <Row label="Due Date" value={formatDate(invoice.dueDate?.toDate?.() || invoice.dueDate)} />
          <View style={styles.statusRow}>
            <Text style={styles.rowKey}>Status</Text>
            <PaymentStatusBadge status={invoice.status} />
          </View>

          <View style={styles.divider} />
          <Row label="Total Amount" value={formatCurrency(invoice.amount)} valueStyle={{ fontWeight: '800', fontSize: FONTS.sizes.xl, color: COLORS.dark }} />
          <Row label="Amount Paid" value={formatCurrency(invoice.paidAmount || 0)} valueStyle={{ color: COLORS.success, fontWeight: '700' }} />
          <Row label="Balance Due" value={formatCurrency(invoice.balance || invoice.amount)} valueStyle={{ color: COLORS.danger, fontWeight: '700' }} />

          {invoice.status !== 'paid' ? (
            <View style={styles.payBox}>
              <Text style={styles.payBoxTitle}>How to Pay</Text>
              <Text style={styles.payBoxText}>{CLUB_INFO.bankName}</Text>
              <Text style={styles.payBoxText}>Account: {CLUB_INFO.bankAccount}</Text>
              <Text style={styles.payBoxText}>Name: {CLUB_INFO.bankAccountName}</Text>
              <Text style={[styles.payBoxText, { color: COLORS.primary, fontWeight: '700', marginTop: 6 }]}>Reference: {invoice.invoiceNo}</Text>
            </View>
          ) : (
            <View style={[styles.payBox, { backgroundColor: COLORS.success + '11', borderColor: COLORS.success + '44', borderWidth: 1 }]}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={[styles.payBoxTitle, { color: COLORS.success, marginTop: 4 }]}>Payment Complete!</Text>
              <Text style={styles.payBoxText}>Receipt: {invoice.receiptNo || 'N/A'}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you! — {CLUB_INFO.name}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Enquire</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]} onPress={handleShare}>
            <Ionicons name="share-social" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Share PDF</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const Row = ({ label, value, valueStyle }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}>
    <Text style={{ fontSize: FONTS.sizes.sm, color: COLORS.darkGray }}>{label}</Text>
    <Text style={[{ fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.dark }, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  invoiceCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  clubName: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.dark },
  invoiceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  logo: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: FONTS.sizes.sm, fontWeight: '900', color: COLORS.secondary },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  rowKey: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  payBox: { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, gap: 4 },
  payBoxTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark },
  payBoxText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  footer: { alignItems: 'center', marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  footerText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, height: 48 },
  actionBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
});
