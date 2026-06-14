import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { saveBroadcast, getBroadcasts } from '../../services/notificationService';
import { getAllPlayers } from '../../services/playerService';
import { openWhatsApp, sanitizePhone } from '../../utils/helpers';
import { WHATSAPP_TEMPLATES } from '../../utils/constants';
import Header from '../../components/common/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { PLAYER_CATEGORIES } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';

export default function BroadcastScreen({ navigation }) {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetCategories, setTargetCategories] = useState([]);
  const [targetRole, setTargetRole] = useState('parents');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const loadBroadcasts = async () => {
    const data = await getBroadcasts();
    setBroadcasts(data);
    setLoading(false);
  };

  const toggleCategory = (cat) => {
    setTargetCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSend = async () => {
    if (!message.trim()) { Alert.alert('Error', 'Please write a message.'); return; }
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title.'); return; }

    Alert.alert(
      'Send Broadcast',
      `This will open WhatsApp for each parent to send: "${title}"\n\nAre you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const players = await getAllPlayers(true);
              const filtered = targetCategories.length > 0
                ? players.filter((p) => targetCategories.includes(p.category))
                : players;

              const phones = [...new Set(filtered.map((p) => p.parentPhone).filter(Boolean))];

              await saveBroadcast(user.uid, title, message, targetCategories, targetRole);

              if (phones.length > 0) {
                for (const phone of phones) {
                  const cleanPhone = sanitizePhone(phone);
                  const fullMsg = WHATSAPP_TEMPLATES.BROADCAST(message);
                  await openWhatsApp(cleanPhone, fullMsg);
                  await new Promise((r) => setTimeout(r, 600));
                }
              }

              setShowCompose(false);
              setTitle('');
              setMessage('');
              setTargetCategories([]);
              loadBroadcasts();
              Alert.alert('Sent!', `Broadcast sent to ${phones.length} parent(s).`);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const renderBroadcast = ({ item }) => (
    <View style={[styles.broadcastCard, SHADOWS.small]}>
      <View style={styles.broadcastHeader}>
        <View style={styles.broadcastIcon}>
          <Ionicons name="megaphone" size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.broadcastTitle}>{item.title}</Text>
          <Text style={styles.broadcastDate}>{formatDateTime(item.createdAt?.toDate?.())}</Text>
        </View>
      </View>
      <Text style={styles.broadcastMessage}>{item.message}</Text>
      {item.targetCategories?.length > 0 && (
        <Text style={styles.broadcastTarget}>
          Categories: {item.targetCategories.join(', ')}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Broadcast" onBack={() => navigation.goBack()} />

      <TouchableOpacity style={styles.composeBtn} onPress={() => setShowCompose(true)}>
        <Ionicons name="megaphone" size={20} color={COLORS.white} />
        <Text style={styles.composeBtnText}>New Broadcast</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => item.id}
          renderItem={renderBroadcast}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No broadcasts yet</Text>
            </View>
          )}
        />
      )}

      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Compose Broadcast</Text>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.formLabel}>Broadcast Title *</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Training Schedule Update"
            />

            <Text style={styles.formLabel}>Message *</Text>
            <TextInput
              style={[styles.formInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message here..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.formLabel}>Target Categories (leave empty for all)</Text>
            <View style={styles.chipRow}>
              {PLAYER_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, targetCategories.includes(cat) && styles.chipActive]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[styles.chipText, targetCategories.includes(cat) && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Message Preview</Text>
              <Text style={styles.previewText}>
                📢 Masai United FC{'\n\n'}{message || '[Your message here]'}{'\n\n'}_Masai United FC - Together We Rise_ ⚽🔴
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, sending && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={COLORS.white} />
                  <Text style={styles.sendBtnText}>Send via WhatsApp</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    borderRadius: RADIUS.md,
    height: 48,
    ...SHADOWS.small,
  },
  composeBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: 0 },
  broadcastCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  broadcastHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  broadcastIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  broadcastTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.dark },
  broadcastDate: { fontSize: FONTS.sizes.xs, color: COLORS.midGray },
  broadcastMessage: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, lineHeight: 20 },
  broadcastTarget: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.xs },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.midGray, marginTop: SPACING.md },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  modalContent: { padding: SPACING.lg },
  formLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6, marginTop: SPACING.sm },
  formInput: { borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.dark, backgroundColor: COLORS.offWhite, height: 46 },
  messageInput: { height: 130, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.lightGray },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  previewBox: { backgroundColor: '#075E54' + '11', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderLeftWidth: 4, borderLeftColor: COLORS.success },
  previewTitle: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.success, marginBottom: SPACING.sm },
  previewText: { fontSize: FONTS.sizes.sm, color: COLORS.dark, lineHeight: 22 },
  sendBtn: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOWS.small },
  sendBtnText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
});
