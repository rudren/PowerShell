import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSession, getSessions, getSessionAttendance } from '../../services/attendanceService';
import { getAllPlayers } from '../../services/playerService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { PLAYER_CATEGORIES, SESSION_TYPES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';
import Header from '../../components/common/Header';
import moment from 'moment';

export default function AttendanceManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    category: '',
    type: SESSION_TYPES.TRAINING,
    date: moment().format('YYYY-MM-DD'),
    time: '09:00',
    venue: 'Masai United FC Ground',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    const cat = selectedCategory === 'All' ? null : selectedCategory;
    const data = await getSessions(cat, 30);
    setSessions(data);
  }, [selectedCategory]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleCreateSession = async () => {
    if (!newSession.category) { Alert.alert('Error', 'Select a category.'); return; }
    if (!newSession.date) { Alert.alert('Error', 'Enter session date.'); return; }
    setLoading(true);
    try {
      await createSession({
        ...newSession,
        title: newSession.title || `${newSession.type} - ${newSession.category}`,
      });
      setShowCreateModal(false);
      loadSessions();
      Alert.alert('Success', 'Session created! Coaches can now take attendance.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...PLAYER_CATEGORIES];
  const sessionTypes = Object.values(SESSION_TYPES);

  const renderSession = ({ item }) => (
    <View style={[styles.sessionCard, SHADOWS.small]}>
      <View style={[styles.sessionType, { backgroundColor: getTypeColor(item.type) }]}>
        <Text style={styles.sessionTypeText}>{item.type?.toUpperCase()}</Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <Text style={styles.sessionDate}>
          <Ionicons name="calendar-outline" size={12} /> {formatDate(item.date?.toDate ? item.date.toDate() : new Date())}
          {'  '}<Ionicons name="time-outline" size={12} /> {item.time}
        </Text>
        <Text style={styles.sessionVenue}>
          <Ionicons name="location-outline" size={12} /> {item.venue}
        </Text>
        <View style={styles.sessionFooter}>
          <View style={[styles.catChip, { backgroundColor: getCatColor(item.category) + '22' }]}>
            <Text style={[styles.catChipText, { color: getCatColor(item.category) }]}>{item.category}</Text>
          </View>
          {item.isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={14} color={COLORS.warning} />
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterBtn, selectedCategory === cat && styles.filterBtnActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No sessions yet</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.createBtnText}>Create Session</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Session</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.formLabel}>Session Title (optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Morning Training"
              value={newSession.title}
              onChangeText={(v) => setNewSession({ ...newSession, title: v })}
            />

            <Text style={styles.formLabel}>Category *</Text>
            <View style={styles.chipRow}>
              {PLAYER_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, newSession.category === cat && styles.chipActive]}
                  onPress={() => setNewSession({ ...newSession, category: cat })}
                >
                  <Text style={[styles.chipText, newSession.category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Session Type</Text>
            <View style={styles.chipRow}>
              {sessionTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, newSession.type === type && styles.chipActive]}
                  onPress={() => setNewSession({ ...newSession, type })}
                >
                  <Text style={[styles.chipText, newSession.type === type && styles.chipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.formInput}
              value={newSession.date}
              onChangeText={(v) => setNewSession({ ...newSession, date: v })}
              placeholder="2025-01-15"
            />

            <Text style={styles.formLabel}>Time</Text>
            <TextInput
              style={styles.formInput}
              value={newSession.time}
              onChangeText={(v) => setNewSession({ ...newSession, time: v })}
              placeholder="09:00"
            />

            <Text style={styles.formLabel}>Venue</Text>
            <TextInput
              style={styles.formInput}
              value={newSession.venue}
              onChangeText={(v) => setNewSession({ ...newSession, venue: v })}
            />

            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
              value={newSession.notes}
              onChangeText={(v) => setNewSession({ ...newSession, notes: v })}
              multiline
            />

            <TouchableOpacity
              style={[styles.createBtn, loading && { opacity: 0.7 }]}
              onPress={handleCreateSession}
              disabled={loading}
            >
              <Text style={styles.createBtnText}>Create Session</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getTypeColor = (type) => ({
  training: COLORS.primary,
  match: COLORS.success,
  friendly: '#2196F3',
  tournament: '#FF5722',
}[type] || COLORS.midGray);

const getCatColor = (cat) => ({
  U8: '#4CAF50', U10: '#2196F3', U12: '#9C27B0', U15: '#FF5722', U18: '#FF9800',
}[cat] || '#607D8B');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, backgroundColor: COLORS.lightGray },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: 0 },
  sessionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginBottom: SPACING.sm, overflow: 'hidden', flexDirection: 'row' },
  sessionType: { width: 8 },
  sessionInfo: { flex: 1, padding: SPACING.md },
  sessionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  sessionDate: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: 2 },
  sessionVenue: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: SPACING.sm },
  sessionFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  catChip: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.round },
  catChipText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { fontSize: FONTS.sizes.xs, color: COLORS.success, fontWeight: '600' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingText: { fontSize: FONTS.sizes.xs, color: COLORS.warning, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginVertical: SPACING.md },
  createBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.lg },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  modalContent: { padding: SPACING.lg },
  formLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6, marginTop: SPACING.sm },
  formInput: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.dark, backgroundColor: COLORS.offWhite, height: 46 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.lightGray },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
});
