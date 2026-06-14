import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getPlayersByParent } from '../../services/playerService';
import { getPlayerAttendance, getSessions } from '../../services/attendanceService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { getAttendanceColor, formatDate } from '../../utils/helpers';
import { ATTENDANCE_STATUS } from '../../utils/constants';
import moment from 'moment';

const STATUS_CONFIG = {
  present: { color: COLORS.success, icon: 'checkmark-circle', label: 'Present' },
  absent: { color: COLORS.danger, icon: 'close-circle', label: 'Absent' },
  late: { color: COLORS.warning, icon: 'time', label: 'Late' },
  excused: { color: COLORS.info, icon: 'information-circle', label: 'Excused' },
};

export default function AttendanceView() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear] = useState(moment().year());

  useEffect(() => {
    (async () => {
      const p = await getPlayersByParent(user?.uid);
      setPlayers(p);
      if (p.length > 0) setSelectedPlayer(p[0]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedPlayer) loadAttendance(selectedPlayer);
  }, [selectedPlayer, selectedMonth]);

  const loadAttendance = async (player) => {
    setLoading(true);
    try {
      const [records, playerSessions] = await Promise.all([
        getPlayerAttendance(player.id, selectedMonth, selectedYear),
        getSessions(player.category, 30),
      ]);
      setAttendanceRecords(records);
      setSessions(playerSessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthSessions = sessions.filter((s) => {
    const date = s.date?.toDate ? s.date.toDate() : new Date();
    return moment(date).month() + 1 === selectedMonth && moment(date).year() === selectedYear;
  });

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const total = monthSessions.length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSub}>Track your child's attendance</Text>
      </View>

      {players.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerTabs} contentContainerStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.lg }}>
          {players.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.playerTab, selectedPlayer?.id === p.id && styles.playerTabActive]}
              onPress={() => setSelectedPlayer(p)}
            >
              <Text style={[styles.playerTabText, selectedPlayer?.id === p.id && styles.playerTabTextActive]}>
                {p.fullName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
        {months.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.monthBtn, selectedMonth === m && styles.monthBtnActive]}
            onPress={() => setSelectedMonth(m)}
          >
            <Text style={[styles.monthText, selectedMonth === m && styles.monthTextActive]}>
              {moment(`${selectedYear}-${m}`, 'YYYY-M').format('MMM')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {selectedPlayer && (
          <View style={[styles.summaryCard, SHADOWS.medium, { borderTopColor: getAttendanceColor(rate), borderTopWidth: 4 }]}>
            <Text style={styles.summaryName}>{selectedPlayer.fullName}</Text>
            <Text style={styles.summaryMonth}>{moment(`${selectedYear}-${selectedMonth}`, 'YYYY-M').format('MMMM YYYY')}</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: getAttendanceColor(rate) }]}>{rate}%</Text>
                <Text style={styles.summaryLabel}>Rate</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>{presentCount}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{total - presentCount}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${rate}%`, backgroundColor: getAttendanceColor(rate) }]} />
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {monthSessions.map((session) => {
              const record = attendanceRecords.find((r) => r.sessionId === session.id);
              const status = record?.status || 'absent';
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.absent;

              return (
                <View key={session.id} style={[styles.sessionRow, SHADOWS.small]}>
                  <View style={[styles.statusIcon, { backgroundColor: cfg.color + '18' }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionDate}>{formatDate(session.date?.toDate ? session.date.toDate() : new Date())}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: cfg.color + '22' }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}

            {monthSessions.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>No sessions this month</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  playerTabs: { backgroundColor: COLORS.white, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  playerTab: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  playerTabActive: { backgroundColor: COLORS.primary },
  playerTabText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray },
  playerTabTextActive: { color: COLORS.white },
  monthScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  monthBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  monthBtnActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray },
  monthTextActive: { color: COLORS.white },
  content: { padding: SPACING.lg },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  summaryName: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark },
  summaryMonth: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: SPACING.md },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  progressBarContainer: { height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  sessionRow: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs, gap: SPACING.sm },
  statusIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sessionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.dark },
  sessionDate: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray },
  statusPill: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.round },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.midGray, marginTop: SPACING.sm },
});
