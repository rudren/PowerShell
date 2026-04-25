import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { getPlayerStats } from '../../services/playerService';
import Header from '../../components/common/Header';
import CategoryBadge from '../../components/common/CategoryBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatDateTime, getAttendanceColor } from '../../utils/helpers';

export default function PlayerProgress({ route, navigation }) {
  const { player } = route.params;
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const NOTE_TYPES = [
    { key: 'general', label: 'General', color: '#607D8B' },
    { key: 'skill', label: 'Skill Dev', color: '#2196F3' },
    { key: 'fitness', label: 'Fitness', color: COLORS.success },
    { key: 'discipline', label: 'Discipline', color: COLORS.warning },
    { key: 'injury', label: 'Injury', color: COLORS.danger },
    { key: 'achievement', label: 'Achievement', color: COLORS.secondary },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [playerStats, progressNotes] = await Promise.all([
          getPlayerStats(player.id),
          getDocs(query(
            collection(db, 'playerProgress'),
            where('playerId', '==', player.id),
            orderBy('createdAt', 'desc')
          )),
        ]);
        setStats(playerStats);
        setNotes(progressNotes.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddNote = async () => {
    if (!newNote.trim()) { Alert.alert('Error', 'Please write a note.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'playerProgress'), {
        playerId: player.id,
        playerName: player.fullName,
        coachId: user.uid,
        coachName: user.name,
        note: newNote.trim(),
        type: noteType,
        createdAt: serverTimestamp(),
      });
      setNewNote('');
      const updated = await getDocs(query(
        collection(db, 'playerProgress'),
        where('playerId', '==', player.id),
        orderBy('createdAt', 'desc')
      ));
      setNotes(updated.docs.map((d) => ({ id: d.id, ...d.data() })));
      Alert.alert('Saved', 'Progress note added!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const getNoteTypeConfig = (type) => NOTE_TYPES.find((t) => t.key === type) || NOTE_TYPES[0];

  return (
    <View style={styles.container}>
      <Header title="Player Progress" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, SHADOWS.medium]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{player.fullName?.[0] || '?'}</Text>
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
          <Text style={styles.position}>{player.position || 'Position not set'}</Text>
        </View>

        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, SHADOWS.small]}>
              <Text style={[styles.statValue, { color: getAttendanceColor(stats.attendanceRate) }]}>
                {stats.attendanceRate}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={[styles.statCard, SHADOWS.small]}>
              <Text style={styles.statValue}>{stats.attended}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={[styles.statCard, SHADOWS.small]}>
              <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>
        )}

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Add Progress Note</Text>
          <Text style={styles.formLabel}>Note Type</Text>
          <View style={styles.noteTypeRow}>
            {NOTE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.noteTypeBtn, noteType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                onPress={() => setNoteType(t.key)}
              >
                <Text style={[styles.noteTypeBtnText, noteType === t.key && { color: COLORS.white }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.noteInput}
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Write your observation or note here..."
            placeholderTextColor={COLORS.midGray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleAddNote}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="save" size={18} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Note</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress History</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : notes.length === 0 ? (
            <Text style={styles.emptyText}>No progress notes yet</Text>
          ) : (
            notes.map((note) => {
              const cfg = getNoteTypeConfig(note.type);
              return (
                <View key={note.id} style={[styles.noteCard, SHADOWS.small, { borderLeftColor: cfg.color }]}>
                  <View style={styles.noteHeader}>
                    <View style={[styles.noteTypePill, { backgroundColor: cfg.color + '22' }]}>
                      <Text style={[styles.noteTypePillText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.noteDate}>{formatDateTime(note.createdAt?.toDate?.())}</Text>
                  </View>
                  <Text style={styles.noteText}>{note.note}</Text>
                  <Text style={styles.noteCoach}>— {note.coachName}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  profileCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  playerName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.sm },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  jerseyBadge: { backgroundColor: COLORS.secondary + '33', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  jerseyText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.secondaryDark },
  position: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.dark },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginTop: 2 },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  formLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: SPACING.sm },
  noteTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  noteTypeBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.lightGray },
  noteTypeBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.darkGray },
  noteInput: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, padding: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.dark, height: 100, backgroundColor: COLORS.offWhite, marginBottom: SPACING.md },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  saveBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.midGray, textAlign: 'center', paddingVertical: SPACING.lg },
  noteCard: { borderLeftWidth: 4, borderRadius: RADIUS.sm, padding: SPACING.md, backgroundColor: COLORS.offWhite, marginBottom: SPACING.sm },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  noteTypePill: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.round },
  noteTypePillText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  noteDate: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  noteText: { fontSize: FONTS.sizes.sm, color: COLORS.dark, lineHeight: 20, marginBottom: 4 },
  noteCoach: { fontSize: FONTS.sizes.xs, color: COLORS.midGray, fontStyle: 'italic' },
});
