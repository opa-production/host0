import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

const TABS = ['Report', 'My Issues'];

const ISSUE_TYPES = [
  { value: 'damage', label: 'Damage' },
  { value: 'late_return', label: 'Late return' },
  { value: 'no_show', label: 'No show' },
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  open: { label: 'Open', bg: '#FFF3CD', color: '#856404', icon: 'time-outline' },
  in_review: { label: 'In Review', bg: '#CCE5FF', color: '#004085', icon: 'hourglass-outline' },
  resolved: { label: 'Resolved', bg: '#D4EDDA', color: '#155724', icon: 'checkmark-circle-outline' },
  closed: { label: 'Closed', bg: '#E2E3E5', color: '#383D41', icon: 'close-circle-outline' },
};

function getStatusStyle(status) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  return STATUS_CONFIG[key] || STATUS_CONFIG.open;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReportIssueScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const bookingRef = route?.params?.bookingRef || 'Booking';
  const bookingId = route?.params?.bookingId || null;

  const [activeTab, setActiveTab] = useState(0);
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const [tabTrackWidth, setTabTrackWidth] = useState(0);

  // Report form state
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const scrollRef = useRef(null);
  const detailsInputRef = useRef(null);

  // My Issues state
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const switchTab = useCallback((index) => {
    setActiveTab(index);
    Animated.spring(tabIndicator, {
      toValue: index,
      useNativeDriver: false,
      friction: 20,
      tension: 200,
    }).start();
  }, [tabIndicator]);

  const fetchIssues = useCallback(async (silent = false) => {
    if (!silent) setLoadingIssues(true);
    try {
      const token = await getUserToken();
      if (!token) return;
      const res = await fetch(getApiUrl(API_ENDPOINTS.HOST_ISSUES), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || data || []);
      }
    } catch (_) {
      // silently fail
    } finally {
      setLoadingIssues(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 1) fetchIssues();
  }, [activeTab, fetchIssues]);

  const submit = async () => {
    if (!selectedType) {
      Alert.alert('Select issue type', 'Please pick an issue type.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Add details', 'Please describe what happened.');
      return;
    }
    if (description.trim().length > 2000) {
      Alert.alert('Too long', 'Description must be 2000 characters or less.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getUserToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      if (!bookingId) {
        Alert.alert('Error', 'Booking reference is missing.');
        setSubmitting(false);
        return;
      }

      const res = await fetch(getApiUrl(API_ENDPOINTS.HOST_REPORT_ISSUE(bookingId)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issue_type: selectedType,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        Alert.alert('Submitted', 'Your report has been sent to support.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.detail || err.message || 'Failed to submit report. Please try again.');
      }
    } catch (_) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReportForm = () => (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.card}>
        <Text style={styles.caption}>About</Text>
        <Text style={styles.value}>{bookingRef}</Text>
      </View>

      {/* Issue Type Dropdown */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Issue type</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={selectedType ? styles.dropdownText : styles.dropdownPlaceholder}>
            {ISSUE_TYPES.find(t => t.value === selectedType)?.label || 'Select issue type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.subtle} />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <TextInput
          ref={detailsInputRef}
          style={styles.input}
          placeholder="Tell us what happened…"
          placeholderTextColor={COLORS.subtle}
          value={description}
          onChangeText={(text) => { if (text.length <= 2000) setDescription(text); }}
          multiline
          textAlignVertical="top"
          maxLength={2000}
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 600);
          }}
        />
        <View style={styles.helperRow}>
          <Text style={styles.helper}>Support will reach out if more information is needed.</Text>
          <Text style={[styles.helper, description.length > 1800 && { color: COLORS.danger }]}>
            {description.length}/2000
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
        onPress={submit}
        activeOpacity={0.9}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStatusBadge = (status) => {
    const s = getStatusStyle(status);
    return (
      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
        <Ionicons name={s.icon} size={13} color={s.color} />
        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
      </View>
    );
  };

  const formatIssueType = (type) => {
    const found = ISSUE_TYPES.find(t => t.value === type);
    if (found) return found.label;
    return (type || 'Issue').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderIssueCard = ({ item }) => (
    <View style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <View style={styles.issueTypeRow}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.brand} />
          <Text style={styles.issueType}>{formatIssueType(item.issue_type)}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>
      {(item.booking_id_display || item.booking_id) && (
        <Text style={styles.issueBookingRef}>
          {item.booking_id_display || `Booking #${item.booking_id}`}
        </Text>
      )}
      {item.description && (
        <Text style={styles.issueDetails} numberOfLines={3}>{item.description}</Text>
      )}
      <View style={styles.issueFooter}>
        <Ionicons name="calendar-outline" size={13} color={COLORS.subtle} />
        <Text style={styles.issueDate}>{formatDate(item.created_at)}</Text>
      </View>
    </View>
  );

  const renderMyIssues = () => (
    <FlatList
      data={issues}
      keyExtractor={(item, i) => String(item.id || i)}
      renderItem={renderIssueCard}
      contentContainerStyle={[
        styles.content,
        issues.length === 0 && styles.emptyContainer,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchIssues(true); }}
          tintColor={COLORS.brand}
        />
      }
      ListEmptyComponent={
        loadingIssues ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.brand} size="large" />
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.borderStrong} />
            <Text style={styles.emptyTitle}>No issues reported</Text>
            <Text style={styles.emptySubtitle}>
              Switch to the Report tab to submit an issue
            </Text>
          </View>
        )
      }
    />
  );

  // Dropdown modal
  const renderDropdownModal = () => (
    <Modal
      visible={dropdownOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setDropdownOpen(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setDropdownOpen(false)}
      >
        <View style={styles.dropdownModal}>
          <Text style={styles.dropdownModalTitle}>Select issue type</Text>
          {ISSUE_TYPES.map((type) => {
            const active = type.value === selectedType;
            return (
              <TouchableOpacity
                key={type.value}
                style={[styles.dropdownOption, active && styles.dropdownOptionActive]}
                onPress={() => {
                  setSelectedType(type.value);
                  setDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]}>
                  {type.label}
                </Text>
                {active && <Ionicons name="checkmark" size={20} color={COLORS.brand} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report issue</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        <View
          style={styles.tabTrack}
          onLayout={(e) => setTabTrackWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{
                  translateX: tabIndicator.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, tabTrackWidth ? (tabTrackWidth - 6) / 2 : 0],
                  }),
                }],
              },
            ]}
          />
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabBtn}
              onPress={() => switchTab(i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {activeTab === 0 ? renderReportForm() : renderMyIssues()}
      </KeyboardAvoidingView>

      {renderDropdownModal()}
    </View>
  );
}

const TAB_HEIGHT = 42;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex1: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.title,
    fontSize: 20,
  },
  headerRight: {
    width: 40,
    height: 40,
  },

  /* ── Tab Toggle ── */
  tabBar: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderStrong,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    zIndex: 1,
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '50%',
    height: TAB_HEIGHT,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    ...TYPE.bodyStrong,
    color: COLORS.subtle,
  },
  tabTextActive: {
    color: COLORS.text,
  },

  /* ── Content ── */
  content: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 120,
    gap: SPACING.m,
    paddingTop: SPACING.s,
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

  /* ── Dropdown ── */
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  dropdownText: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  dropdownPlaceholder: {
    ...TYPE.body,
    color: COLORS.subtle,
  },

  /* ── Dropdown Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dropdownModal: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.m,
    overflow: 'hidden',
  },
  dropdownModalTitle: {
    ...TYPE.section,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.l,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(0,122,255,0.08)',
  },
  dropdownOptionText: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  dropdownOptionTextActive: {
    color: COLORS.brand,
  },

  /* ── Details Input ── */
  input: {
    minHeight: 120,
    maxHeight: 200,
    borderRadius: 12,
    padding: SPACING.m,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    color: COLORS.text,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  helper: {
    ...TYPE.caption,
  },

  /* ── Submit Button ── */
  primaryButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#ffffff',
  },

  /* ── My Issues ── */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    ...TYPE.section,
    color: COLORS.muted,
    marginTop: SPACING.s,
  },
  emptySubtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  issueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    gap: 10,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  issueTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  issueType: {
    ...TYPE.bodyStrong,
    fontSize: 15,
  },
  issueBookingRef: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  issueDetails: {
    ...TYPE.body,
    color: COLORS.muted,
  },
  issueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  issueDate: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    ...TYPE.micro,
    fontFamily: 'Nunito-Bold',
  },
});
