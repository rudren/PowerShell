import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBroadcasts } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatDateTime } from '../../utils/helpers';

export default function ParentBroadcasts() {
  const insets = useSafeAreaInsets();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await getBroadcasts();
    setBroadcasts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Club Updates</Text>
        <Text style={styles.headerSub}>Latest news from Masai United FC</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No updates yet</Text>
              <Text style={styles.emptySub}>Check back later for club news</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[styles.card, SHADOWS.small]}>
              <View style={styles.cardTop}>
                <View style={styles.icon}>
                  <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.date}>{formatDateTime(item.createdAt?.toDate?.())}</Text>
                </View>
              </View>
              <Text style={styles.message}>{item.message}</Text>
              {item.targetCategories?.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.targetCategories.map((cat) => (
                    <View key={cat} style={styles.catTag}>
                      <Text style={styles.catTagText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
  list: { padding: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.dark },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.midGray, marginTop: 2 },
  message: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  catTag: { backgroundColor: COLORS.primary + '18', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.round },
  catTagText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.darkGray, marginTop: SPACING.md },
  emptySub: { fontSize: FONTS.sizes.sm, color: COLORS.midGray, textAlign: 'center', marginTop: SPACING.sm },
});
