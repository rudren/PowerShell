import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllPlayers, deactivatePlayer } from '../../services/playerService';
import CategoryBadge from '../../components/common/CategoryBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { PLAYER_CATEGORIES } from '../../utils/constants';

export default function PlayerManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPlayers = useCallback(async () => {
    try {
      const data = await getAllPlayers(true);
      setPlayers(data);
      setFiltered(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load players.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  useEffect(() => {
    let list = players;
    if (selectedCategory !== 'All') list = list.filter((p) => p.category === selectedCategory);
    if (search.trim()) {
      const lower = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(lower) ||
          p.jerseyNumber?.toString().includes(lower)
      );
    }
    setFiltered(list);
  }, [search, selectedCategory, players]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayers();
    setRefreshing(false);
  };

  const handleDeactivate = (player) => {
    Alert.alert(
      'Deactivate Player',
      `Remove ${player.fullName} from active roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            await deactivatePlayer(player.id);
            loadPlayers();
          },
        },
      ]
    );
  };

  const categories = ['All', ...PLAYER_CATEGORIES];

  const renderPlayer = ({ item }) => (
    <TouchableOpacity
      style={[styles.playerCard, SHADOWS.small]}
      onPress={() => navigation.navigate('PlayerDetail', { playerId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.playerAvatar}>
        <Text style={styles.avatarText}>{item.fullName?.[0] || '?'}</Text>
        {item.jerseyNumber && (
          <View style={styles.jerseyBadge}>
            <Text style={styles.jerseyText}>#{item.jerseyNumber}</Text>
          </View>
        )}
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.fullName}</Text>
        <Text style={styles.playerSub}>{item.position || 'Position N/A'} • DOB: {item.dob || 'N/A'}</Text>
        <CategoryBadge category={item.category} size="sm" />
      </View>
      <TouchableOpacity
        style={styles.moreBtn}
        onPress={() => handleDeactivate(item)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.midGray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Players</Text>
          <Text style={styles.headerSub}>{filtered.length} active players</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddPlayer')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.midGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor={COLORS.midGray}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.midGray} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterBtn, selectedCategory === cat && styles.filterBtnActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No players found</Text>
            <TouchableOpacity style={styles.addEmptyBtn} onPress={() => navigation.navigate('AddPlayer')}>
              <Text style={styles.addEmptyText}>Add First Player</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

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
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.dark },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.lightGray,
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  playerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  playerAvatar: { position: 'relative' },
  avatarText: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '18',
    textAlign: 'center',
    lineHeight: 52,
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  jerseyText: { fontSize: 8, fontWeight: '800', color: COLORS.dark },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  playerSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginBottom: 4 },
  moreBtn: { padding: SPACING.xs },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginTop: SPACING.md, marginBottom: SPACING.lg },
  addEmptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  addEmptyText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
});
