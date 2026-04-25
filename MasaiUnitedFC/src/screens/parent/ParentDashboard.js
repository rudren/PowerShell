import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getPlayersByParent } from '../../services/playerService';
import { getParentInvoices } from '../../services/paymentService';
import { getAttendanceSummary } from '../../services/attendanceService';
import { logoutUser } from '../../services/authService';
import CategoryBadge from '../../components/common/CategoryBadge';
import PaymentStatusBadge from '../../components/common/PaymentStatusBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatCurrency, getAttendanceColor, getAttendancePercentage } from '../../utils/helpers';
import { CLUB_INFO } from '../../utils/constants';
import moment from 'moment';

export default function ParentDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [p, inv] = await Promise.all([
        getPlayersByParent(user?.uid),
        getParentInvoices(user?.uid),
      ]);
      setPlayers(p);
      setInvoices(inv.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const unpaidCount = invoices.filter((i) => i.status !== 'paid').length;
  const unpaidAmount = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + (i.balance || i.amount || 0), 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.clubRow}>
          <View style={styles.clubLogo}>
            <Text style={styles.clubLogoText}>MUFC</Text>
          </View>
          <View>
            <Text style={styles.clubName}>{CLUB_INFO.name}</Text>
            <Text style={styles.greeting}>Welcome, {user?.name?.split(' ')[0] || 'Parent'} 👋</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Sign Out', 'Sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logoutUser },
        ])}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {unpaidCount > 0 && (
          <TouchableOpacity
            style={[styles.alertBanner, SHADOWS.small]}
            onPress={() => navigation.navigate('Payments')}
          >
            <Ionicons name="alert-circle" size={22} color={COLORS.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{unpaidCount} Outstanding Payment{unpaidCount > 1 ? 's' : ''}</Text>
              <Text style={styles.alertSub}>Total: {formatCurrency(unpaidAmount)} pending</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Children</Text>
          {players.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="football-outline" size={40} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No players registered yet</Text>
            </View>
          ) : (
            players.map((player) => (
              <View key={player.id} style={[styles.playerCard, SHADOWS.small]}>
                <View style={styles.playerLeft}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>{player.fullName?.[0] || '?'}</Text>
                    {player.jerseyNumber && (
                      <View style={styles.jerseyBadge}>
                        <Text style={styles.jerseyText}>#{player.jerseyNumber}</Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={styles.playerName}>{player.fullName}</Text>
                    <Text style={styles.playerPosition}>{player.position || 'Position N/A'}</Text>
                    <CategoryBadge category={player.category} size="sm" />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {invoices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {invoices.map((inv) => (
              <View key={inv.id} style={[styles.invoiceCard, SHADOWS.small]}>
                <View>
                  <Text style={styles.invoicePlayer}>{inv.playerName}</Text>
                  <Text style={styles.invoiceMonth}>{inv.monthLabel}</Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invoiceAmount}>{formatCurrency(inv.amount)}</Text>
                  <PaymentStatusBadge status={inv.status} />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Club Info</Text>
          <View style={[styles.clubInfoCard, SHADOWS.small]}>
            <InfoRow icon="location" label="Location" value={CLUB_INFO.address} />
            <InfoRow icon="call" label="Contact" value={CLUB_INFO.phone} />
            <InfoRow icon="mail" label="Email" value={CLUB_INFO.email} />
            <InfoRow icon="calendar" label="Founded" value={CLUB_INFO.founded.toString()} />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={`${icon}-outline`} size={16} color={COLORS.primary} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  clubLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  clubLogoText: { fontSize: FONTS.sizes.xs, fontWeight: '900', color: COLORS.primary },
  clubName: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.white },
  greeting: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.danger + '11', margin: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.danger + '33' },
  alertTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.danger },
  alertSub: { fontSize: FONTS.sizes.xs, color: COLORS.danger + 'AA' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  seeAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.xl, alignItems: 'center', ...SHADOWS.small },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.midGray, marginTop: SPACING.sm },
  playerCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  playerLeft: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  playerAvatar: { position: 'relative' },
  playerAvatarText: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '18', textAlign: 'center', lineHeight: 56, fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.primary },
  jerseyBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.secondary, borderRadius: RADIUS.xs, paddingHorizontal: 4 },
  jerseyText: { fontSize: 8, fontWeight: '800', color: COLORS.dark },
  playerName: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  playerPosition: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginBottom: 4 },
  invoiceCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  invoicePlayer: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  invoiceMonth: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark },
  clubInfoCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600', width: 60 },
  infoValue: { fontSize: FONTS.sizes.sm, color: COLORS.dark, flex: 1 },
});
