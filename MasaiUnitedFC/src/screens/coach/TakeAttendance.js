import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getSessions, getPlayersByCategory, batchMarkAttendance, getSessionAttendance } from '../../services/attendanceService';
import { getPlayersByCategory as fetchPlayers } from '../../services/playerService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { ATTENDANCE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export default function TakeAttendance({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(route?.params?.session || null);
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState([]);

  const categories = user?.categories || [];

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadPlayersAndAttendance(selectedSession);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const allSessions = await Promise.all(
        categories.map((cat) => getSessions(cat, 10))
      );
      const merged = allSessions.flat().filter((s) => !s.isCompleted);
      setSessions(merged);
      if (route?.params?.session) {
        setSelectedSession(route.params.session);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayersAndAttendance = async (session) => {
    setLoading(true);
    try {
      const [playerList, existing] = await Promise.all([
        fetchPlayers(session.category),
        getSessionAttendance(session.id),
      ]);
      setPlayers(playerList);
      setExistingAttendance(existing);

      const initAttendance = {};
      playerList.forEach((p) => {
        const found = existing.find((e) => e.playerId === p.id);
        initAttendance[p.id] = found?.status || ATTENDANCE_STATUS.PRESENT;
      });
      setAttendance(initAttendance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (playerId, status) => {
    setAttendance((prev) => ({ ...prev, [playerId]: status }));
  };

  const markAll = (status) => {
    const newAttendance = {};
    players.forEach((p) => { newAttendance[p.id] = status; });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    const attendanceList = players.map((p) => ({
      playerId: p.id,
      status: attendance[p.id] || ATTENDANCE_STATUS.PRESENT,
    }));

    const presentCount = attendanceList.filter((a) => a.status === 'present').length;

    Alert.alert(
      'Submit Attendance',
      `${presentCount}/${players.length} players present.\n\nSubmit and close session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSaving(true);
            try {
              await batchMarkAttendance(selectedSession.id, attendanceList);
              Alert.alert('Done!', 'Attendance recorded successfully.', [
                { text: 'OK', onPress: () => { setSelectedSession(null); loadSessions(); } },
              ]);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const statusConfig = [
    { status: ATTENDANCE_STATUS.PRESENT, label: 'Present', color: COLORS.success, icon: 'checkmark-circle' },
    { status: ATTENDANCE_STATUS.LATE, label: 'Late', color: COLORS.warning, icon: 'time' },
    { status: ATTENDANCE_STATUS.ABSENT, label: 'Absent', color: COLORS.danger, icon: 'close-circle' },
    { status: ATTENDANCE_STATUS.EXCUSED, label: 'Excused', color: COLORS.info, icon: 'information-circle' },
  ];

  if (loading && !selectedSession) {
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!selectedSession) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Take Attendance</Text>
        </View>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No pending sessions</Text>
            <Text style={styles.emptySub}>Ask admin to create sessions first</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.sessionList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sessionCard, SHADOWS.small]}
                onPress={() => setSelectedSession(item)}
                activeOpacity={0.85}
              >
                <View style={[styles.sessionTypeBar, { backgroundColor: getTypeColor(item.type) }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{item.title}</Text>
                  <Text style={styles.sessionMeta}>
                    {item.category} • {formatDate(item.date?.toDate ? item.date.toDate() : new Date())} • {item.time}
                  </Text>
                  <Text style={styles.sessionVenue}>{item.venue}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.midGray} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedSession(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
          <Text style={styles.headerTitle}>{selectedSession.title}</Text>
          <Text style={styles.headerSub}>{selectedSession.category} • {formatDate(selectedSession.date?.toDate ? selectedSession.date.toDate() : new Date())}</Text>
        </View>
        <Text style={styles.countBadge}>{presentCount}/{players.length}</Text>
      </View>

      <View style={styles.markAllRow}>
        <Text style={styles.markAllLabel}>Mark All:</Text>
        {[ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.markAllBtn, { borderColor: s === 'present' ? COLORS.success : COLORS.danger }]}
            onPress={() => markAll(s)}
          >
            <Text style={[styles.markAllBtnText, { color: s === 'present' ? COLORS.success : COLORS.danger }]}>
              All {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playerList}
          renderItem={({ item, index }) => (
            <View style={[styles.playerCard, SHADOWS.small]}>
              <View style={styles.playerLeft}>
                <Text style={styles.playerIndex}>{index + 1}</Text>
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>{item.fullName?.[0] || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.playerName}>{item.fullName}</Text>
                  {item.jerseyNumber && <Text style={styles.jersey}>#{item.jerseyNumber}</Text>}
                </View>
              </View>
              <View style={styles.statusRow}>
                {statusConfig.map((cfg) => (
                  <TouchableOpacity
                    key={cfg.status}
                    style={[styles.statusBtn, attendance[item.id] === cfg.status && { backgroundColor: cfg.color }]}
                    onPress={() => setStatus(item.id, cfg.status)}
                  >
                    <Ionicons
                      name={cfg.icon}
                      size={20}
                      color={attendance[item.id] === cfg.status ? COLORS.white : cfg.color}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={COLORS.white} /> : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.submitBtnText}>Submit Attendance</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getTypeColor = (type) => ({
  training: COLORS.primary,
  match: COLORS.success,
  friendly: '#2196F3',
  tournament: '#FF5722',
}[type] || COLORS.midGray);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)' },
  countBadge: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.secondary },
  markAllRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  markAllLabel: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  markAllBtn: { paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.round, borderWidth: 1.5 },
  markAllBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  sessionList: { padding: SPACING.lg },
  sessionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  sessionTypeBar: { width: 6, alignSelf: 'stretch' },
  sessionInfo: { flex: 1, padding: SPACING.md },
  sessionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  sessionMeta: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginTop: 2 },
  sessionVenue: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyText: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.darkGray, marginTop: SPACING.md },
  emptySub: { fontSize: FONTS.sizes.md, color: COLORS.midGray, textAlign: 'center', marginTop: SPACING.sm },
  playerList: { padding: SPACING.md, paddingBottom: 100 },
  playerCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  playerIndex: { fontSize: FONTS.sizes.sm, color: COLORS.midGray, width: 20, textAlign: 'center' },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  playerName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.dark },
  jersey: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  statusRow: { flexDirection: 'row', gap: SPACING.xs },
  statusBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.lightGray },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  submitBtn: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOWS.small },
  submitBtnText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
});
