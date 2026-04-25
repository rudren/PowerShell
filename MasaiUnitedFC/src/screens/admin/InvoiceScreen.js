import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CLUB_INFO } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import moment from 'moment';

export default function InvoiceScreen({ route, navigation }) {
  const { invoice } = route.params;

  const generateHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .header { background: #C41E3A; color: white; padding: 24px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .club-name { font-size: 22px; font-weight: 900; }
    .invoice-label { font-size: 14px; letter-spacing: 3px; opacity: 0.8; margin-top: 4px; }
    .logo { background: #FFD700; width: 64px; height: 64px; border-radius: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #C41E3A; font-size: 14px; text-align: center; line-height: 64px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: 700; color: #C41E3A; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #C41E3A; padding-bottom: 6px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .key { font-size: 13px; color: #666; }
    .val { font-size: 13px; font-weight: 600; color: #333; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 16px; background: #f8f8f8; border-radius: 8px; margin-top: 8px; }
    .total-key { font-size: 16px; font-weight: 700; }
    .total-val { font-size: 20px; font-weight: 900; color: #C41E3A; }
    .status-paid { background: #28A74522; color: #28A745; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; }
    .status-unpaid { background: #DC354522; color: #DC3545; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #999; }
    .bank-box { background: #f0f0f0; padding: 16px; border-radius: 8px; margin-top: 16px; }
    .bank-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .bank-info { font-size: 12px; color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="club-name">${CLUB_INFO.name}</div>
      <div class="invoice-label">INVOICE</div>
      <div style="font-size:12px; margin-top:8px; opacity:0.8">${CLUB_INFO.address}</div>
    </div>
    <div class="logo">MUFC</div>
  </div>

  <div class="section">
    <div class="section-title">Invoice Information</div>
    <div class="row"><span class="key">Invoice No.</span><span class="val">${invoice.invoiceNo}</span></div>
    <div class="row"><span class="key">Date Issued</span><span class="val">${moment().format('DD MMMM YYYY')}</span></div>
    <div class="row"><span class="key">Due Date</span><span class="val">${formatDate(invoice.dueDate?.toDate?.() || invoice.dueDate)}</span></div>
    <div class="row"><span class="key">Status</span><span class="${invoice.status === 'paid' ? 'status-paid' : 'status-unpaid'}">${invoice.status?.toUpperCase()}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Player Details</div>
    <div class="row"><span class="key">Player Name</span><span class="val">${invoice.playerName}</span></div>
    <div class="row"><span class="key">Category</span><span class="val">${invoice.category}</span></div>
    <div class="row"><span class="key">Period</span><span class="val">${invoice.monthLabel}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Payment Summary</div>
    <div class="row"><span class="key">Monthly Membership Fee</span><span class="val">${formatCurrency(invoice.amount)}</span></div>
    <div class="row"><span class="key">Amount Paid</span><span class="val" style="color:#28A745">${formatCurrency(invoice.paidAmount || 0)}</span></div>
    <div class="row"><span class="key">Balance</span><span class="val" style="color:#DC3545">${formatCurrency(invoice.balance || invoice.amount)}</span></div>
    <div class="total-row">
      <span class="total-key">Total Invoice Amount</span>
      <span class="total-val">${formatCurrency(invoice.amount)}</span>
    </div>
  </div>

  ${invoice.status !== 'paid' ? `
  <div class="bank-box">
    <div class="bank-title">💳 Payment Details</div>
    <div class="bank-info">
      Bank: ${CLUB_INFO.bankName}<br>
      Account No.: ${CLUB_INFO.bankAccount}<br>
      Account Name: ${CLUB_INFO.bankAccountName}<br><br>
      Please include Invoice No. <strong>${invoice.invoiceNo}</strong> in the payment reference.
    </div>
  </div>
  ` : `
  <div class="bank-box" style="background:#28A74511; border:1px solid #28A74522;">
    <div class="bank-title" style="color:#28A745">✅ Payment Received</div>
    <div class="bank-info">Receipt No.: <strong>${invoice.receiptNo || 'N/A'}</strong></div>
  </div>
  `}

  <div class="footer">
    <p>Thank you for your support of ${CLUB_INFO.name}!</p>
    <p>${CLUB_INFO.email} | ${CLUB_INFO.phone}</p>
    <p>Est. ${CLUB_INFO.founded} — Together We Rise ⚽</p>
  </div>
</body>
</html>`;

  const handlePrint = async () => {
    try {
      await Print.printAsync({ html: generateHTML() });
    } catch (err) {
      Alert.alert('Print Error', err.message);
    }
  };

  const handleShare = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${invoice.invoiceNo}` });
    } catch (err) {
      Alert.alert('Share Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Invoice"
        subtitle={invoice.invoiceNo}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.invoiceCard, SHADOWS.medium]}>
          <View style={styles.invoiceTop}>
            <View>
              <Text style={styles.clubName}>{CLUB_INFO.name}</Text>
              <Text style={styles.invoiceLabel}>INVOICE</Text>
              <Text style={styles.clubAddress}>{CLUB_INFO.address}</Text>
            </View>
            <View style={styles.logo}>
              <Text style={styles.logoText}>MUFC</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <SectionTitle title="Invoice Information" />
          <InfoRow label="Invoice No." value={invoice.invoiceNo} />
          <InfoRow label="Date Issued" value={moment().format('DD MMMM YYYY')} />
          <InfoRow label="Due Date" value={formatDate(invoice.dueDate?.toDate?.() || invoice.dueDate)} />

          <View style={styles.divider} />
          <SectionTitle title="Player Details" />
          <InfoRow label="Player Name" value={invoice.playerName} />
          <InfoRow label="Category" value={invoice.category} />
          <InfoRow label="Period" value={invoice.monthLabel} />

          <View style={styles.divider} />
          <SectionTitle title="Payment Summary" />
          <InfoRow label="Monthly Fee" value={formatCurrency(invoice.amount)} />
          <InfoRow label="Amount Paid" value={formatCurrency(invoice.paidAmount || 0)} valueColor={COLORS.success} />
          <InfoRow label="Balance Due" value={formatCurrency(invoice.balance || invoice.amount)} valueColor={COLORS.danger} />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Invoice Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.amount)}</Text>
          </View>

          {invoice.status !== 'paid' ? (
            <View style={styles.paymentBox}>
              <Text style={styles.paymentBoxTitle}>Payment Details</Text>
              <Text style={styles.paymentBoxText}>Bank: {CLUB_INFO.bankName}</Text>
              <Text style={styles.paymentBoxText}>Account: {CLUB_INFO.bankAccount}</Text>
              <Text style={styles.paymentBoxText}>Name: {CLUB_INFO.bankAccountName}</Text>
              <Text style={[styles.paymentBoxText, { marginTop: SPACING.sm, color: COLORS.primary }]}>
                Ref: {invoice.invoiceNo}
              </Text>
            </View>
          ) : (
            <View style={[styles.paymentBox, { backgroundColor: COLORS.success + '11', borderColor: COLORS.success + '44', borderWidth: 1 }]}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={[styles.paymentBoxTitle, { color: COLORS.success }]}>Payment Received</Text>
              <Text style={styles.paymentBoxText}>Receipt: {invoice.receiptNo || 'N/A'}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for supporting {CLUB_INFO.name}!</Text>
            <Text style={styles.footerSub}>Est. {CLUB_INFO.founded} — Together We Rise ⚽</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={handlePrint}>
            <Ionicons name="print" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Print</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Share PDF</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const SectionTitle = ({ title }) => (
  <Text style={{ fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {title}
  </Text>
);

const InfoRow = ({ label, value, valueColor }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}>
    <Text style={{ fontSize: FONTS.sizes.sm, color: COLORS.darkGray }}>{label}</Text>
    <Text style={{ fontSize: FONTS.sizes.sm, fontWeight: '600', color: valueColor || COLORS.dark }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  invoiceCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  clubName: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.dark },
  invoiceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  clubAddress: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginTop: 4 },
  logo: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: FONTS.sizes.sm, fontWeight: '900', color: COLORS.secondary },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: SPACING.md },
  totalBox: { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: SPACING.md },
  totalLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  totalValue: { fontSize: FONTS.sizes.xxl, fontWeight: '900', color: COLORS.primary },
  paymentBox: { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: SPACING.md, gap: 4 },
  paymentBoxTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  paymentBoxText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  footer: { alignItems: 'center', marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  footerText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  footerSub: { fontSize: FONTS.sizes.xs, color: COLORS.midGray, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, height: 50 },
  actionBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
});
