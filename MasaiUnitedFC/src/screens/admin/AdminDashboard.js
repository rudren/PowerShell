import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAllPlayers } from '../../services/playerService';
import { getPaymentSummary, getUnpaidInvoices } from '../../services/paymentService';
import { getSessions } from '../../services/attendanceService';
import { logoutUser } from '../../services/authService';
import { getPendingCount } from '../../services/pendingService';
import StatCard from '../../components/common/StatCard';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CLUB_INFO, PLAYER_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import moment from 'moment';

export default function AdminDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats] = useState({ players: 0, unpaid: 0, sessions: 0, collected: 0 });
  const [unpaidList, setUnpaidList] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = moment().month() + 1;
  const currentYear = moment().year();

  const loadData = useCallback(async () => {
    try {
      const [players, paymentSummary, unpaid, sessions, pCount] = await Promise.all([
        getAllPlayers(true),
        getPaymentSummary(currentMonth, currentYear),
        getUnpaidInvoices(),
        getSessions(null, 10),
        getPendingCount(),
      ]);
      setPendingCount(pCount);

      const catStats = PLAYER_CATEGORIES.map((cat) => ({
        category: cat,
        count: players.filter((p) => p.category === cat).length,
      })).filter((c) => c.count > 0);

      setStats({
        players: players.length,
        unpaid: paymentSummary.unpaid + paymentSummary.partial,
        sessions: sessions.length,
        collected: paymentSummary.paidAmount,
      });
      setCategoryStats(catStats);
      setUnpaidList(unpaid.slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logoutUser() },
    ]);
  };

  const quickActions = [
    { label: 'Add Player', icon: 'person-add', color: COLORS.primary, screen: 'Players' },
    { label: 'Attendance', icon: 'calendar', color: '#2196F3', screen: 'Attendance' },
    { label: 'Payments', icon: 'cash', color: COLORS.success, screen: 'Payments' },
    { label: 'Broadcast', icon: 'megaphone', color: '#FF5722', screen: 'More' },
    { label: 'Reports', icon: 'bar-chart', color: '#9C27B0', screen: 'More' },
    { label: 'Parent View', icon: 'eye', color: '#607D8B', onPress: () => navigation.navigate('ParentViewControl') },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.adminName}>{user?.name || 'Admin'} 👋</Text>
          <Text style={styles.date}>{moment().format('dddd, D MMMM YYYY')}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.clubBanner}>
          <View style={styles.clubLogoSmall}>
            <Text style={styles.clubLogoText}>MUFC</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clubBannerName}>{CLUB_INFO.name}</Text>
            <Text style={styles.clubBannerSub}>Est. {CLUB_INFO.founded} • Admin Panel</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="people" label="Active Players" value={stats.players} color={COLORS.primary} />
            <StatCard icon="alert-circle" label="Unpaid" value={stats.unpaid} color={COLORS.danger} />
            <StatCard icon="calendar" label="Sessions" value={stats.sessions} color="#2196F3" />
            <StatCard icon="cash" label="Collected" value={`RM${Math.round(stats.collected / 1000)}k`} color={COLORS.success} />
          </View>
        </View>

        {pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.pendingBanner, SHADOWS.small]}
            onPress={() => navigation.navigate('Players', { screen: 'PendingApprovals' })}
            activeOpacity={0.85}
          >
            <View style={styles.pendingBannerLeft}>
              <View style={styles.pendingIconWrap}>
                <Ionicons name="logo-google" size={20} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.pendingBannerTitle}>
                  {pendingCount} Google Form Submission{pendingCount > 1 ? 's' : ''} Pending
                </Text>
                <Text style={styles.pendingBannerSub}>Tap to review and approve</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionBtn, SHADOWS.small]}
                onPress={action.onPress || (() => navigation.navigate(action.screen))}
                activeOpacity={0.85}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {categoryStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Players by Category</Text>
            <View style={[styles.categoryCard, SHADOWS.small]}>
              {categoryStats.map((cat, idx) => (
                <View key={cat.category} style={[styles.categoryRow, idx < categoryStats.length - 1 && styles.categoryRowBorder]}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: getCatColor(cat.category) }]} />
                    <Text style={styles.categoryLabel}>{cat.category}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <View style={[styles.categoryBar, { width: `${Math.min((cat.count / stats.players) * 100, 100)}%`, backgroundColor: getCatColor(cat.category) }]} />
                    <Text style={styles.categoryCount}>{cat.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {unpaidList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Payments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {unpaidList.map((inv) => (
              <View key={inv.id} style={[styles.unpaidCard, SHADOWS.small]}>
                <View style={styles.unpaidLeft}>
                  <View style={styles.unpaidAvatar}>
                    <Text style={styles.unpaidAvatarText}>{inv.playerName?.[0] || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.unpaidName}>{inv.playerName}</Text>
                    <Text style={styles.unpaidMonth}>{inv.monthLabel}</Text>
                  </View>
                </View>
                <View style={styles.unpaidRight}>
                  <Text style={styles.unpaidAmount}>{formatCurrency(inv.amount)}</Text>
                  <View style={[styles.statusDot, { backgroundColor: inv.status === 'partial' ? COLORS.warning : COLORS.danger }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

const getCatColor = (cat) => {
  const map = { U8: '#4CAF50', U10: '#2196F3', U12: '#9C27B0', U15: '#FF5722', U18: '#FF9800' };
  return map[cat] || '#607D8B';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.8)' },
  adminName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  date: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: { marginTop: SPACING.xs },
  scroll: { flex: 1, marginTop: -SPACING.lg },
  clubBanner: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.medium,
  },
  clubLogoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubLogoText: { fontSize: FONTS.sizes.sm, fontWeight: '900', color: COLORS.secondary },
  clubBannerName: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark },
  clubBannerSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  seeAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -SPACING.xs },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionBtn: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    width: '30%',
    flex: 1,
    minWidth: 90,
  },
  actionIcon: { width: 48, height: 48, borderRadius: RADIUS.round, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  actionLabel: { fontSize: FONTS.sizes.xs, color: COLORS.dark, fontWeight: '600', textAlign: 'center' },
  categoryCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, justifyContent: 'space-between' },
  categoryRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1, justifyContent: 'flex-end' },
  categoryBar: { height: 8, borderRadius: 4, maxWidth: 80 },
  categoryCount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark, width: 30, textAlign: 'right' },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a73e8',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  pendingBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  pendingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBannerTitle: { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.white },
  pendingBannerSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  unpaidCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  unpaidLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  unpaidAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unpaidAvatarText: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },
  unpaidName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  unpaidMonth: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  unpaidRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  unpaidAmount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.danger },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
