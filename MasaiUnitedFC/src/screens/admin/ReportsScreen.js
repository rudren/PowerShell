import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllPlayers } from '../../services/playerService';
import { getPaymentSummary, getBulkPaymentReport } from '../../services/paymentService';
import { getAttendanceSummary } from '../../services/attendanceService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { PLAYER_CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import moment from 'moment';

export default function ReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({});
  const [categoryReport, setCategoryReport] = useState([]);
  const currentMonth = moment().month() + 1;
  const currentYear = moment().year();

  useEffect(() => {
    (async () => {
      try {
        const [p, ps, cr] = await Promise.all([
          getAllPlayers(true),
          getPaymentSummary(currentMonth, currentYear),
          getBulkPaymentReport(currentMonth, currentYear),
        ]);
        setPlayers(p);
        setPaymentSummary(ps);
        setCategoryReport(cr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const catPlayerCount = PLAYER_CATEGORIES.map((cat) => ({
    category: cat,
    count: players.filter((p) => p.category === cat).length,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSub}>{moment().format('MMMM YYYY')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={[styles.card, SHADOWS.small]}>
              <Text style={styles.cardTitle}>Player Summary</Text>
              <View style={styles.statRow}>
                <StatItem icon="people" label="Total Active" value={players.length} color={COLORS.primary} />
                <StatItem icon="football" label="Categories" value={catPlayerCount.filter((c) => c.count > 0).length} color="#2196F3" />
              </View>
              {catPlayerCount.filter((c) => c.count > 0).map((cat) => (
                <View key={cat.category} style={styles.progressRow}>
                  <Text style={styles.progressLabel}>{cat.category}</Text>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { width: `${(cat.count / players.length) * 100}%`, backgroundColor: getCatColor(cat.category) },
                    ]} />
                  </View>
                  <Text style={styles.progressCount}>{cat.count}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, SHADOWS.small]}>
              <Text style={styles.cardTitle}>Payment Overview — {moment().format('MMMM YYYY')}</Text>
              <View style={styles.statRow}>
                <StatItem icon="checkmark-circle" label="Paid" value={paymentSummary.paid || 0} color={COLORS.success} />
                <StatItem icon="alert-circle" label="Unpaid" value={paymentSummary.unpaid || 0} color={COLORS.danger} />
                <StatItem icon="time" label="Partial" value={paymentSummary.partial || 0} color={COLORS.warning} />
              </View>
              <View style={styles.collectionBox}>
                <Text style={styles.collectionLabel}>Collection Rate</Text>
                <Text style={[styles.collectionValue, { color: paymentSummary.collectionRate >= 80 ? COLORS.success : COLORS.danger }]}>
                  {paymentSummary.collectionRate || 0}%
                </Text>
              </View>
              <View style={styles.statRow}>
                <StatItem icon="cash" label="Collected" value={formatCurrency(paymentSummary.paidAmount || 0)} color={COLORS.success} small />
                <StatItem icon="alert" label="Outstanding" value={formatCurrency(paymentSummary.unpaidAmount || 0)} color={COLORS.danger} small />
              </View>
            </View>

            {categoryReport.length > 0 && (
              <View style={[styles.card, SHADOWS.small]}>
                <Text style={styles.cardTitle}>Payment by Category</Text>
                {categoryReport.map((cat) => (
                  <View key={cat.category} style={styles.catReportRow}>
                    <View style={styles.catReportLeft}>
                      <View style={[styles.catDot, { backgroundColor: getCatColor(cat.category) }]} />
                      <Text style={styles.catReportName}>{cat.category}</Text>
                    </View>
                    <View style={styles.catReportRight}>
                      <Text style={[styles.catPaid, { color: COLORS.success }]}>{cat.paid} paid</Text>
                      <Text style={[styles.catPaid, { color: COLORS.danger }]}>{cat.unpaid} unpaid</Text>
                      <Text style={styles.catAmount}>{formatCurrency(cat.paidAmount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.quickLinks}>
              <Text style={styles.cardTitle}>Quick Links</Text>
              <QuickLink
                icon="megaphone"
                label="Broadcast"
                sub="Send message to all parents"
                color="#FF5722"
                onPress={() => navigation.navigate('Broadcast')}
              />
              <QuickLink
                icon="people"
                label="User Management"
                sub="Manage coaches and parents"
                color="#9C27B0"
                onPress={() => navigation.navigate('UserManagement')}
              />
              <QuickLink
                icon="settings"
                label="Settings"
                sub="App configuration"
                color="#607D8B"
                onPress={() => navigation.navigate('Settings')}
              />
            </View>
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const StatItem = ({ icon, label, value, color, small }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { fontSize: small ? FONTS.sizes.sm : FONTS.sizes.xl, color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickLink = ({ icon, label, sub, color, onPress }) => (
  <TouchableOpacity style={styles.quickLink} onPress={onPress}>
    <View style={[styles.quickLinkIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.quickLinkLabel}>{label}</Text>
      <Text style={styles.quickLinkSub}>{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.midGray} />
  </TouchableOpacity>
);

const getCatColor = (cat) => ({
  U8: '#4CAF50', U10: '#2196F3', U12: '#9C27B0', U15: '#FF5722', U18: '#FF9800',
}[cat] || '#607D8B');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  content: { padding: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontWeight: '800', color: COLORS.dark },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  progressLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.dark, width: 32 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressCount: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.dark, width: 28, textAlign: 'right' },
  collectionBox: { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  collectionLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  collectionValue: { fontSize: FONTS.sizes.xxxl, fontWeight: '900' },
  catReportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  catReportLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catReportName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  catReportRight: { alignItems: 'flex-end', gap: 2 },
  catPaid: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  catAmount: { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.dark },
  quickLinks: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  quickLinkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickLinkLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  quickLinkSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
});
