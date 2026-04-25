import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addPlayer } from '../../services/playerService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { PLAYER_CATEGORIES } from '../../utils/constants';
import Header from '../../components/common/Header';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger'];

export default function AddPlayerScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    jerseyNumber: '',
    position: '',
    category: '',
    school: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentId: '',
    address: '',
    medicalNotes: '',
    monthlyFee: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.fullName.trim()) return 'Player full name is required.';
    if (!form.dob.trim()) return 'Date of birth is required.';
    if (!form.category) return 'Please select a category.';
    if (!form.parentName.trim()) return 'Parent/Guardian name is required.';
    if (!form.parentPhone.trim()) return 'Parent/Guardian phone is required.';
    if (!form.monthlyFee.trim()) return 'Monthly fee is required.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }
    setLoading(true);
    try {
      await addPlayer({
        ...form,
        monthlyFee: parseFloat(form.monthlyFee) || 0,
        jerseyNumber: parseInt(form.jerseyNumber) || null,
      });
      Alert.alert('Success', `${form.fullName} has been added!`, [
        { text: 'Add Another', onPress: () => setForm({ ...form, fullName: '', dob: '', jerseyNumber: '', medicalNotes: '' }) },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add player.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldTextArea]}
        placeholder={placeholder || label}
        placeholderTextColor={COLORS.midGray}
        value={form[field]}
        onChangeText={(v) => update(field, v)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Add Player" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Player Details</Text>
          <Field label="Full Name *" field="fullName" />
          <Field label="Date of Birth *" field="dob" placeholder="YYYY-MM-DD" />
          <Field label="Jersey Number" field="jerseyNumber" keyboardType="numeric" />
          <Field label="School" field="school" />

          <Text style={styles.fieldLabel}>Position</Text>
          <View style={styles.chipRow}>
            {POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.chip, form.position === pos && styles.chipActive]}
                onPress={() => update('position', pos)}
              >
                <Text style={[styles.chipText, form.position === pos && styles.chipTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.chipRow}>
            {PLAYER_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => update('category', cat)}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Parent / Guardian Details</Text>
          <Field label="Parent Name *" field="parentName" />
          <Field label="Phone Number *" field="parentPhone" keyboardType="phone-pad" placeholder="+601X-XXXXXXX" />
          <Field label="Email Address" field="parentEmail" keyboardType="email-address" />
          <Field label="Home Address" field="address" multiline />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Field label="Emergency Contact Name" field="emergencyContact" />
          <Field label="Emergency Phone" field="emergencyPhone" keyboardType="phone-pad" />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Financial</Text>
          <Field label="Monthly Fee (RM) *" field="monthlyFee" keyboardType="numeric" placeholder="e.g. 80" />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <Field label="Medical / Special Notes" field="medicalNotes" multiline />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={22} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Save Player</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.md },
  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    backgroundColor: COLORS.offWhite,
    height: 46,
  },
  fieldTextArea: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.offWhite,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
});
