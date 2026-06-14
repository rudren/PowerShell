import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBroadcasts } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { formatDateTime } from '../../utils/helpers';

export default function CoachBroadcasts() {
  const insets = useSafeAreaInsets();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getBroadcasts();
      setBroadcasts(data);
      setLoading(false);
    })();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Club Updates</Text>
        <Text style={styles.headerSub}>Broadcasts from Admin</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No updates yet</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[styles.card, SHADOWS.small]}>
              <View style={styles.cardHeader}>
                <View style={styles.icon}>
                  <Ionicons name="megaphone" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.date}>{formatDateTime(item.createdAt?.toDate?.())}</Text>
                </View>
              </View>
              <Text style={styles.message}>{item.message}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  message: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginTop: SPACING.md },
});
