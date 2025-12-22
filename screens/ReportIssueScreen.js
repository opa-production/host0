import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function ReportIssueScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const bookingRef = route?.params?.bookingRef || 'Booking';

  const issueTypes = useMemo(
    () => [
      'Damage',
      'Late return',
      'Payment',
      'Vehicle problem',
      'Renter behavior',
      'Other',
    ],
    []
  );

  const [selectedType, setSelectedType] = useState('Damage');
  const [details, setDetails] = useState('');

  const submit = () => {
    if (!details.trim()) {
      Alert.alert('Add details', 'Please describe what happened.');
      return;
    }

    Alert.alert('Submitted', 'Your report has been sent to support.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Report issue</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.caption}>About</Text>
          <Text style={styles.value}>{bookingRef}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Issue type</Text>
          <View style={styles.chipsWrap}>
            {issueTypes.map((t) => {
              const active = t === selectedType;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedType(t)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Tell us what happened…"
            placeholderTextColor={COLORS.subtle}
            value={details}
            onChangeText={setDetails}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.helper}>Support will reach out if more information is needed.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={submit} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Submit report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  headerTitle: {
    ...TYPE.title,
  },
  headerRight: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
    gap: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  caption: {
    ...TYPE.caption,
  },
  value: {
    ...TYPE.bodyStrong,
    marginTop: 4,
  },
  sectionTitle: {
    ...TYPE.section,
    marginBottom: SPACING.m,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
  chipText: {
    ...TYPE.caption,
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.brand,
  },
  input: {
    minHeight: 120,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    color: COLORS.text,
  },
  helper: {
    ...TYPE.caption,
    marginTop: SPACING.m,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#ffffff',
  },
});
