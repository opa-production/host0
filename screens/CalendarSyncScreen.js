import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import AppLoader from "../ui/AppLoader";

const SYNC_ENABLED_KEY = '@calendar_sync_enabled';
const SYNC_CALENDAR_ID_KEY = '@calendar_sync_calendar_id';

export default function CalendarSyncScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadSyncSettings();
    requestCalendarPermission();
  }, []);

  const loadSyncSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(SYNC_ENABLED_KEY);
      const calendarId = await AsyncStorage.getItem(SYNC_CALENDAR_ID_KEY);
      
      if (enabled === 'true') {
        setSyncEnabled(true);
      }
      if (calendarId) {
        setSelectedCalendarId(calendarId);
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const requestCalendarPermission = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status === 'granted') {
        setHasPermission(true);
        await fetchCalendars();
      } else {
        setHasPermission(false);
        Alert.alert(
          'Calendar Permission Required',
          'Please grant calendar access to sync with your personal calendar.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting calendar permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const calendarIds = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Filter to get writable calendars and sort by title
      const availableCalendars = calendarIds
        .filter(cal => cal.allowsModifications)
        .sort((a, b) => a.title.localeCompare(b.title));
      
      setCalendars(availableCalendars);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      Alert.alert('Error', 'Failed to fetch calendars. Please try again.');
    }
  };

  const handleSelectCalendar = (calendarId) => {
    lightHaptic();
    setSelectedCalendarId(calendarId);
  };

  const handleEnableSync = async () => {
    if (!selectedCalendarId) {
      Alert.alert('Select Calendar', 'Please select a calendar to sync with.');
      return;
    }

    if (!hasPermission) {
      await requestCalendarPermission();
      return;
    }

    setIsSyncing(true);
    lightHaptic();

    try {
      // Save sync settings
      await AsyncStorage.setItem(SYNC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(SYNC_CALENDAR_ID_KEY, selectedCalendarId);
      
      setSyncEnabled(true);
      
      // Sync calendar events
      await syncCalendarEvents(selectedCalendarId);
      
      Alert.alert(
        'Sync Enabled',
        'Your calendar has been synced. Blocked dates from your personal calendar will be reflected in Smart Calendar.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error enabling sync:', error);
      Alert.alert('Error', 'Failed to enable calendar sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisableSync = async () => {
    lightHaptic();
    Alert.alert(
      'Disable Sync',
      'Are you sure you want to disable calendar sync?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(SYNC_ENABLED_KEY);
              await AsyncStorage.removeItem(SYNC_CALENDAR_ID_KEY);
              setSyncEnabled(false);
              setSelectedCalendarId(null);
              Alert.alert('Sync Disabled', 'Calendar sync has been disabled.');
            } catch (error) {
              console.error('Error disabling sync:', error);
            }
          },
        },
      ]
    );
  };

  const syncCalendarEvents = async (calendarId) => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Start from last month
      const endDate = new Date(now.getFullYear() + 1, 11, 31); // End at end of next year

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      // Process events and return blocked dates
      // This will be used by SmartCalendarScreen to update unavailable dates
      const blockedDates = events.map(event => ({
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        title: event.title,
      }));

      // Store blocked dates in AsyncStorage for SmartCalendarScreen to use
      await AsyncStorage.setItem('@calendar_blocked_dates', JSON.stringify(blockedDates));

      return blockedDates;
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      throw error;
    }
  };

  const handleRefreshCalendars = async () => {
    lightHaptic();
    setIsLoading(true);
    await fetchCalendars();
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar Sync</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <AppLoader size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>Loading calendars...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar Sync</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {!hasPermission ? (
          <View style={styles.card}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.subtle} style={styles.icon} />
            <Text style={styles.cardTitle}>Calendar Access Required</Text>
            <Text style={styles.cardText}>
              To sync with your personal calendar, please grant calendar access in your device settings.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestCalendarPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {syncEnabled && (
              <View style={styles.syncStatusCard}>
                <View style={styles.syncStatusRow}>
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                  <View style={styles.syncStatusText}>
                    <Text style={styles.syncStatusTitle}>Sync Enabled</Text>
                    <Text style={styles.syncStatusSubtitle}>
                      Your calendar is being synced with Smart Calendar
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.disableButton}
                  onPress={handleDisableSync}
                  activeOpacity={0.8}
                >
                  <Text style={styles.disableButtonText}>Disable</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Select Calendar</Text>
              <Text style={styles.sectionHint}>
                Choose which calendar to sync with Smart Calendar. Events in this calendar will automatically block dates.
              </Text>

              {calendars.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={32} color={COLORS.subtle} />
                  <Text style={styles.emptyText}>No calendars available</Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshCalendars}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={16} color={COLORS.text} />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {calendars.map((calendar) => (
                    <TouchableOpacity
                      key={calendar.id}
                      style={[
                        styles.calendarItem,
                        selectedCalendarId === calendar.id && styles.calendarItemSelected,
                      ]}
                      onPress={() => handleSelectCalendar(calendar.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.calendarItemLeft}>
                        <View
                          style={[
                            styles.calendarColorDot,
                            { backgroundColor: calendar.color || COLORS.brand },
                          ]}
                        />
                        <View style={styles.calendarItemText}>
                          <Text
                            style={[
                              styles.calendarItemTitle,
                              selectedCalendarId === calendar.id && styles.calendarItemTitleSelected,
                            ]}
                          >
                            {calendar.title}
                          </Text>
                          {calendar.source && (
                            <Text style={styles.calendarItemSource}>{calendar.source.name}</Text>
                          )}
                        </View>
                      </View>
                      {selectedCalendarId === calendar.id && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>

            {selectedCalendarId && !syncEnabled && (
              <TouchableOpacity
                style={[styles.primaryButton, isSyncing && styles.primaryButtonDisabled]}
                onPress={handleEnableSync}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <>
                    <AppLoader size="small" color="#FFFFFF" style={styles.buttonLoader} />
                    <Text style={styles.primaryButtonText}>Syncing...</Text>
                  </>
                ) : (
                  <Text style={styles.primaryButtonText}>Enable Sync</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.brand} />
              <Text style={styles.infoText}>
                When enabled, events in your selected calendar will automatically block those dates in Smart Calendar. This helps prevent double bookings.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  content: {
    padding: SPACING.l,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl * 2,
  },
  loadingText: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginTop: SPACING.m,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  cardTitle: {
    ...TYPE.section,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  cardText: {
    ...TYPE.body,
    color: COLORS.subtle,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    ...TYPE.section,
    marginBottom: SPACING.s,
  },
  sectionHint: {
    ...TYPE.caption,
    color: COLORS.subtle,
    marginBottom: SPACING.m,
  },
  syncStatusCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  syncStatusText: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  syncStatusTitle: {
    ...TYPE.bodyStrong,
    color: '#2E7D32',
    marginBottom: 2,
  },
  syncStatusSubtitle: {
    ...TYPE.caption,
    color: '#4CAF50',
  },
  disableButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: SPACING.m,
  },
  disableButtonText: {
    ...TYPE.bodyStrong,
    color: '#D32F2F',
    fontSize: 14,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: RADIUS.button,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  calendarItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderColor: COLORS.brand,
    borderWidth: 1,
  },
  calendarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.m,
  },
  calendarItemText: {
    flex: 1,
  },
  calendarItemTitle: {
    ...TYPE.bodyStrong,
    marginBottom: 2,
  },
  calendarItemTitleSelected: {
    color: COLORS.brand,
  },
  calendarItemSource: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginTop: SPACING.m,
    marginBottom: SPACING.l,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.m,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    gap: 6,
  },
  refreshButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: SPACING.l,
    flexDirection: 'row',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  buttonLoader: {
    marginRight: 8,
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  infoText: {
    ...TYPE.caption,
    color: COLORS.text,
    flex: 1,
    marginLeft: SPACING.s,
    lineHeight: 18,
  },
});

