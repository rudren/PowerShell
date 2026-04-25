import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getAllPlayers } from '../../services/playerService';
import CategoryBadge from '../../components/common/CategoryBadge';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function CoachPlayerList({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = user?.categories || [];

  useEffect(() => {
    (async () => {
      const all = await getAllPlayers(true);
      const filtered = categories.length > 0 ? all.filter((p) => categories.includes(p.category)) : all;
      setPlayers(filtered);
      setLoading(false);
    })();
  }, []);

  const filtered = search.trim()
    ? players.filter((p) => p.fullName?.toLowerCase().includes(search.toLowerCase()))
    : players;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Players</Text>
        <Text style={styles.headerSub}>{filtered.length} players</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.midGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.midGray}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.playerCard, SHADOWS.small]}
              onPress={() => navigation.navigate('PlayerProgress', { player: item })}
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
                <Text style={styles.playerSub}>{item.position || 'No position'}</Text>
                <CategoryBadge category={item.category} size="sm" />
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.midGray} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: SPACING.lg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, height: 46, gap: SPACING.sm, ...SHADOWS.small },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.dark },
  list: { padding: SPACING.lg, paddingTop: 0 },
  playerCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.md },
  playerAvatar: { position: 'relative' },
  avatarText: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '18', textAlign: 'center', lineHeight: 52, fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  jerseyBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.secondary, borderRadius: RADIUS.xs, paddingHorizontal: 4 },
  jerseyText: { fontSize: 8, fontWeight: '800', color: COLORS.dark },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  playerSub: { fontSize: FONTS.sizes.xs, color: COLORS.darkGray, marginBottom: 4 },
});
