import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function ExtendBookingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const bookingLabel = useMemo(() => {
    const ref = route?.params?.bookingRef;
    return ref || 'Booking';
  }, [route?.params?.bookingRef]);

  const [newEndDate, setNewEndDate] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!newEndDate.trim()) {
      Alert.alert('End date required', 'Enter a new end date/time for this extension.');
      return;
    }

    Alert.alert('Request sent', 'Your extension request has been submitted.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Extend booking</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.caption}>Booking</Text>
          <Text style={styles.value} numberOfLines={1}>{bookingLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>New end date</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jan 22, 2024 • 11:00"
            placeholderTextColor={COLORS.subtle}
            value={newEndDate}
            onChangeText={setNewEndDate}
          />

          <Text style={[styles.sectionTitle, { marginTop: SPACING.l }]}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Anything the guest should know…"
            placeholderTextColor={COLORS.subtle}
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.helper}>We’ll notify the guest to approve the extension.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={submit} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Send request</Text>
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
  input: {
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    color: COLORS.text,
  },
  inputMultiline: {
    minHeight: 110,
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
