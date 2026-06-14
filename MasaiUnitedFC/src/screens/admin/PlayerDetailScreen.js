import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlayerStats } from '../../services/playerService';
import { getPlayerInvoices } from '../../services/paymentService';
import { sendAttendanceReport } from '../../services/notificationService';
import CategoryBadge from '../../components/common/CategoryBadge';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatCurrency, formatDate, getAttendanceColor } from '../../utils/helpers';
import moment from 'moment';

export default function PlayerDetailScreen({ route, navigation }) {
  const { playerId } = route.params;
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [playerStats, playerInvoices] = await Promise.all([
          getPlayerStats(playerId),
          getPlayerInvoices(playerId),
        ]);
        setStats(playerStats);
        setInvoices(playerInvoices.slice(0, 6));
      } catch (err) {
        Alert.alert('Error', 'Failed to load player details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!stats) return null;
  const { player } = stats;

  const handleSendReport = async () => {
    if (!player.parentPhone) { Alert.alert('No phone', 'Parent phone not available.'); return; }
    await sendAttendanceReport(
      player.parentPhone, player.fullName,
      moment().format('MMMM YYYY'), stats.attended, stats.totalSessions
    );
  };

  const attendanceColor = getAttendanceColor(stats.attendanceRate);

  return (
    <View style={styles.container}>
      <Header title="Player Profile" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, SHADOWS.medium]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{player.fullName?.[0] || '?'}</Text>
          </View>
          <Text style={styles.playerName}>{player.fullName}</Text>
          <View style={styles.badgeRow}>
            <CategoryBadge category={player.category} />
            {player.jerseyNumber && (
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyText}>#{player.jerseyNumber}</Text>
              </View>
            )}
          </View>
          <Text style={styles.position}>{player.position || 'No position set'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statItem, SHADOWS.small]}>
            <Text style={[styles.statValue, { color: attendanceColor }]}>{stats.attendanceRate}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={[styles.statItem, SHADOWS.small]}>
            <Text style={styles.statValue}>{stats.attended}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statItem, SHADOWS.small]}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absences</Text>
          </View>
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <InfoRow icon="calendar" label="Date of Birth" value={player.dob} />
          <InfoRow icon="school" label="School" value={player.school} />
          <InfoRow icon="fitness" label="Registered" value={formatDate(player.registrationDate)} />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Parent / Guardian</Text>
            <TouchableOpacity onPress={handleSendReport} style={styles.waBtn}>
              <Ionicons name="logo-whatsapp" size={16} color={COLORS.success} />
              <Text style={styles.waBtnText}>Send Report</Text>
            </TouchableOpacity>
          </View>
          <InfoRow icon="person" label="Name" value={player.parentName} />
          <InfoRow icon="call" label="Phone" value={player.parentPhone} />
          <InfoRow icon="mail" label="Email" value={player.parentEmail} />
          <InfoRow icon="location" label="Address" value={player.address} />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {invoices.length === 0 ? (
            <Text style={styles.emptyText}>No invoices found</Text>
          ) : (
            invoices.map((inv) => (
              <View key={inv.id} style={styles.invoiceRow}>
                <View>
                  <Text style={styles.invoiceMonth}>{inv.monthLabel}</Text>
                  <Text style={styles.invoiceNo}>{inv.invoiceNo}</Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invoiceAmount}>{formatCurrency(inv.amount)}</Text>
                  <PaymentStatusBadge status={inv.status} />
                </View>
              </View>
            ))
          )}
        </View>

        {player.medicalNotes && (
          <View style={[styles.section, SHADOWS.small, { borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}>
            <Text style={styles.sectionTitle}>Medical Notes</Text>
            <Text style={styles.medicalText}>{player.medicalNotes}</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={`${icon}-outline`} size={16} color={COLORS.primary} style={styles.infoIcon} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarLargeText: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  playerName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  jerseyBadge: { backgroundColor: COLORS.secondary + '33', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  jerseyText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.secondaryDark },
  position: { fontSize: FONTS.sizes.md, color: COLORS.darkGray },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  statItem: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginTop: 2 },
  section: { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm, gap: SPACING.xs },
  infoIcon: { marginTop: 2 },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600', width: 80 },
  infoValue: { fontSize: FONTS.sizes.sm, color: COLORS.dark, flex: 1 },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '18', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.round },
  waBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.success, fontWeight: '700' },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  invoiceMonth: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  invoiceNo: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.midGray, textAlign: 'center', paddingVertical: SPACING.lg },
  medicalText: { fontSize: FONTS.sizes.md, color: COLORS.dark, lineHeight: 22 },
});
