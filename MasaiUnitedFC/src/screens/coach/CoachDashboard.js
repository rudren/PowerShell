import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getPlayersByCategory } from '../../services/playerService';
import { getSessions } from '../../services/attendanceService';
import { logoutUser } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatDate } from '../../utils/helpers';
import moment from 'moment';

export default function CoachDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const categories = user?.categories || [];

  const loadData = async () => {
    try {
      const allPlayers = await Promise.all(categories.map((cat) => getPlayersByCategory(cat)));
      setPlayers(allPlayers.flat());
      const allSessions = await Promise.all(categories.map((cat) => getSessions(cat, 5)));
      const merged = allSessions.flat().sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date();
        const dateB = b.date?.toDate ? b.date.toDate() : new Date();
        return dateB - dateA;
      });
      setSessions(merged.slice(0, 6));
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

  const pendingSessions = sessions.filter((s) => !s.isCompleted);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={styles.greeting}>Hello, Coach</Text>
          <Text style={styles.coachName}>{user?.name || 'Coach'} 👋</Text>
          <Text style={styles.date}>{moment().format('dddd, D MMMM YYYY')}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Sign Out', 'Sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logoutUser },
        ])}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, SHADOWS.small]}>
            <Text style={styles.statValue}>{players.length}</Text>
            <Text style={styles.statLabel}>My Players</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.small]}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{pendingSessions.length}</Text>
            <Text style={styles.statLabel}>Pending Sessions</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.small]}>
            <Text style={styles.statValue}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Categories</Text>
            <View style={styles.catRow}>
              {categories.map((cat) => (
                <View key={cat} style={[styles.catBadge, { backgroundColor: getCatColor(cat) + '22' }]}>
                  <Text style={[styles.catText, { color: getCatColor(cat) }]}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, SHADOWS.small]}
              onPress={() => navigation.navigate('Attendance')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '18' }]}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Take Attendance</Text>
              <Text style={styles.actionSub}>Mark today's session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, SHADOWS.small]}
              onPress={() => navigation.navigate('Players')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#2196F3' + '18' }]}>
                <Ionicons name="people" size={28} color="#2196F3" />
              </View>
              <Text style={styles.actionLabel}>Player Progress</Text>
              <Text style={styles.actionSub}>View all players</Text>
            </TouchableOpacity>
          </View>
        </View>

        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.map((session) => (
              <View key={session.id} style={[styles.sessionCard, SHADOWS.small]}>
                <View style={[styles.sessionTypeBar, { backgroundColor: getTypeColor(session.type) }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionMeta}>
                    {session.category} • {formatDate(session.date?.toDate ? session.date.toDate() : new Date())} • {session.time}
                  </Text>
                </View>
                {session.isCompleted ? (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                ) : (
                  <TouchableOpacity
                    style={styles.markBtn}
                    onPress={() => navigation.navigate('Attendance', { sessionId: session.id, session })}
                  >
                    <Text style={styles.markBtnText}>Mark</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const getCatColor = (cat) => ({ U8: '#4CAF50', U10: '#2196F3', U12: '#9C27B0', U15: '#FF5722', U18: '#FF9800' }[cat] || '#607D8B');
const getTypeColor = (type) => ({ training: COLORS.primary, match: COLORS.success, friendly: '#2196F3', tournament: '#FF5722' }[type] || COLORS.midGray);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.8)' },
  coachName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  date: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: SPACING.lg, gap: SPACING.sm, marginTop: -SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, textAlign: 'center' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  catRow: { flexDirection: 'row', gap: SPACING.sm },
  catBadge: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.round },
  catText: { fontSize: FONTS.sizes.md, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  actionCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  actionLabel: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark, textAlign: 'center' },
  actionSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, textAlign: 'center', marginTop: 2 },
  sessionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, overflow: 'hidden' },
  sessionTypeBar: { width: 6, alignSelf: 'stretch' },
  sessionInfo: { flex: 1, padding: SPACING.md },
  sessionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  sessionMeta: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginTop: 2 },
  markBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, margin: SPACING.md },
  markBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.white },
});
