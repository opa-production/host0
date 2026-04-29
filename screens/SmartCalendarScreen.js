import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostCars } from '../services/carService';
import { blockCarDates, getBlockedDates, unblockCarDate } from '../services/calendarService';
import AppLoader from "../ui/AppLoader";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetweenInclusive(d, start, end) {
  if (!start || !end) return false;
  const t = startOfDay(d).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  const lo = Math.min(s, e);
  const hi = Math.max(s, e);
  return t >= lo && t <= hi;
}

function formatMonthYear(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function fmtRange(start, end) {
  if (!start || !end) return '';
  const s = startOfDay(start);
  const e = startOfDay(end);
  const lo = s.getTime() <= e.getTime() ? s : e;
  const hi = s.getTime() <= e.getTime() ? e : s;
  const sameMonth = lo.getMonth() === hi.getMonth() && lo.getFullYear() === hi.getFullYear();
  if (sameMonth) {
    return `${lo.toLocaleDateString(undefined, { month: 'short' })} ${lo.getDate()}–${hi.getDate()}`;
  }
  return `${lo.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${hi.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function normalizeRange(start, end) {
  const s = startOfDay(start);
  const e = startOfDay(end);
  if (s.getTime() <= e.getTime()) return { start: s, end: e };
  return { start: e, end: s };
}

function rangesOverlap(a, b) {
  const aS = startOfDay(a.start).getTime();
  const aE = startOfDay(a.end).getTime();
  const bS = startOfDay(b.start).getTime();
  const bE = startOfDay(b.end).getTime();
  return aS <= bE && bS <= aE;
}

function mergeRanges(ranges) {
  const sorted = [...ranges]
    .map((r) => normalizeRange(r.start, r.end))
    .sort((x, y) => startOfDay(x.start).getTime() - startOfDay(y.start).getTime());

  const out = [];
  for (const r of sorted) {
    if (!out.length) {
      out.push(r);
      continue;
    }

    const prev = out[out.length - 1];
    const prevEnd = startOfDay(prev.end).getTime();
    const curStart = startOfDay(r.start).getTime();

    // merge touching ranges too (prevEnd + 1 day)
    const oneDay = 24 * 60 * 60 * 1000;
    if (curStart <= prevEnd + oneDay) {
      const curEnd = startOfDay(r.end).getTime();
      if (curEnd > prevEnd) prev.end = r.end;
    } else {
      out.push(r);
    }
  }

  return out;
}

/** Merge consecutive blocked date ranges for display; each item has { start, end, ids: (number|string)[] } for unblock. */
function mergeConsecutiveBlockedRanges(ranges) {
  if (!ranges || ranges.length === 0) return [];
  const oneDayMs = 24 * 60 * 60 * 1000;
  const withId = ranges
    .map((r) => ({ ...r, id: r.id ?? r.blocked_date_id }))
    .filter((r) => r.id != null && r.id !== '');
  const sorted = withId
    .map((r) => ({
      start: startOfDay(r.start),
      end: startOfDay(r.end),
      id: r.id,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged = [];
  for (const r of sorted) {
    const rStart = r.start.getTime();
    const rEnd = r.end.getTime();
    if (merged.length === 0) {
      merged.push({ start: r.start, end: r.end, ids: [r.id] });
      continue;
    }
    const last = merged[merged.length - 1];
    const lastEnd = last.end.getTime();
    if (rStart <= lastEnd + oneDayMs) {
      if (rEnd > lastEnd) last.end = r.end;
      last.ids.push(r.id);
    } else {
      merged.push({ start: r.start, end: r.end, ids: [r.id] });
    }
  }
  return merged;
}

export default function SmartCalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  const [unavailable, setUnavailable] = useState([]);
  const [blockedDatesData, setBlockedDatesData] = useState([]); // Store API blocked dates with IDs

  const [instantBooking, setInstantBooking] = useState(false);
  const [bufferHours, setBufferHours] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(false);

  // Car selection
  const [cars, setCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [isLoadingBlockedDates, setIsLoadingBlockedDates] = useState(false);
  const [isCarPickerVisible, setIsCarPickerVisible] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const monthGrid = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();

    const first = new Date(y, m, 1);
    const startWeekday = first.getDay(); // 0=Sun

    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);

    // cap to 6 rows
    while (cells.length < 42) cells.push(null);
    return cells.slice(0, 42);
  }, [month]);

  const isUnavailableDay = (d) => {
    if (!d) return false;
    return unavailable.some((r) => isBetweenInclusive(d, r.start, r.end));
  };

  const isSelectedDay = (d) => {
    if (!d) return false;
    if (selectionStart && !selectionEnd) return isSameDay(d, selectionStart);
    if (selectionStart && selectionEnd) return isBetweenInclusive(d, selectionStart, selectionEnd);
    return false;
  };

  const onDayPress = (d) => {
    if (!d || !selectedCarId) {
      if (!selectedCarId) {
        Alert.alert('Select Car', 'Please select a car first to manage its calendar');
      }
      return;
    }

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(d);
      setSelectionEnd(null);
      return;
    }

    setSelectionEnd(d);
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const blockSelected = async () => {
    if (!selectionStart || !selectedCarId) {
      Alert.alert('Error', 'Please select a car first');
      return;
    }

    const end = selectionEnd || selectionStart;
    const range = normalizeRange(selectionStart, end);
    const startDate = startOfDay(range.start).toISOString();
    const endDate = startOfDay(range.end).toISOString();

    setIsBlocking(true);
    try {
      // If backend only creates one day per request, block each day in the range.
      const startMs = startOfDay(range.start).getTime();
      const endMs = startOfDay(range.end).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const daysToBlock = Math.round((endMs - startMs) / oneDayMs) + 1;

      if (daysToBlock <= 0) {
        setIsBlocking(false);
        return;
      }

      let allOk = true;
      let lastError = null;

      for (let i = 0; i < daysToBlock; i += 1) {
        const dayStart = new Date(startMs + i * oneDayMs);
        const dayEnd = new Date(startMs + i * oneDayMs);
        const dayStartStr = startOfDay(dayStart).toISOString();
        const dayEndStr = startOfDay(dayEnd).toISOString();
        const result = await blockCarDates(selectedCarId, dayStartStr, dayEndStr);
        if (!result.success) {
          allOk = false;
          lastError = result.error;
        }
      }

      if (allOk) {
        await loadBlockedDates();
        clearSelection();
        Alert.alert('Success', daysToBlock === 1 ? 'Date blocked successfully' : `${daysToBlock} dates blocked successfully`);
      } else {
        Alert.alert('Error', lastError || 'Failed to block some dates');
      }
    } catch (error) {
      console.error('Error blocking dates:', error);
      Alert.alert('Error', 'Failed to block dates. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockSelected = async () => {
    if (!selectedCarId) {
      Alert.alert('Error', 'Please select a car first');
      return;
    }
    if (!selectionStart) {
      Alert.alert('Select dates', 'Tap a start date, then an end date on the calendar to select the range to unblock.');
      return;
    }

    const end = selectionEnd || selectionStart;
    const sel = normalizeRange(selectionStart, end);

    // Find blocked dates that overlap with selection
    const overlappingBlockedDates = blockedDatesData.filter((bd) => {
      const bdStart = startOfDay(new Date(bd.start_date));
      const bdEnd = startOfDay(new Date(bd.end_date));
      return rangesOverlap({ start: bdStart, end: bdEnd }, sel);
    });

    if (overlappingBlockedDates.length === 0) {
      Alert.alert('Info', 'No blocked dates found for the selected range');
      return;
    }

    // Unblock all overlapping dates
    setIsBlocking(true);
    try {
      const unblockPromises = overlappingBlockedDates.map((bd) =>
        unblockCarDate(selectedCarId, bd.id || bd.blocked_date_id)
      );
      const results = await Promise.all(unblockPromises);
      
      if (results.every((r) => r.success)) {
        // Reload blocked dates
        await loadBlockedDates();
        clearSelection();
        Alert.alert('Success', 'Dates unblocked successfully');
      } else {
        const errors = results.filter((r) => !r.success).map((r) => r.error);
        Alert.alert('Error', errors.join('\n') || 'Failed to unblock some dates');
      }
    } catch (error) {
      console.error('Error unblocking dates:', error);
      Alert.alert('Error', 'Failed to unblock dates. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  // Load cars on mount
  useEffect(() => {
    loadCars();
  }, []);

  // Load blocked dates when car is selected
  useEffect(() => {
    if (selectedCarId) {
      loadBlockedDates();
    } else {
      setUnavailable([]);
      setBlockedDatesData([]);
    }
  }, [selectedCarId]);

  // Reload sync status when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSyncStatus();
      if (selectedCarId) {
        loadBlockedDates();
      }
    });
    return unsubscribe;
  }, [navigation, selectedCarId]);

  const loadCars = async () => {
    setIsLoadingCars(true);
    try {
      const result = await getHostCars({ summary: true });
      if (result.success && result.cars) {
        setCars(result.cars);
        // Auto-select first car if available
        if (result.cars.length > 0 && !selectedCarId) {
          setSelectedCarId(result.cars[0].id);
          setSelectedCar(result.cars[0]);
        }
      }
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setIsLoadingCars(false);
    }
  };

  const loadBlockedDates = async () => {
    if (!selectedCarId) return;
    
    setIsLoadingBlockedDates(true);
    try {
      const result = await getBlockedDates(selectedCarId);
      if (result.success && result.blockedDates) {
        setBlockedDatesData(result.blockedDates);
        // Convert API blocked dates to unavailable ranges
        const ranges = result.blockedDates.map((bd) => ({
          start: new Date(bd.start_date),
          end: new Date(bd.end_date),
          id: bd.id || bd.blocked_date_id,
          reason: bd.reason,
        }));
        setUnavailable(ranges);
      } else {
        setBlockedDatesData([]);
        setUnavailable([]);
      }
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    } finally {
      setIsLoadingBlockedDates(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const syncEnabledValue = await AsyncStorage.getItem('@calendar_sync_enabled');
      const isEnabled = syncEnabledValue === 'true';
      setSyncEnabled(isEnabled);

      if (isEnabled) {
        // Load blocked dates from synced calendar
        const blockedDatesJson = await AsyncStorage.getItem('@calendar_blocked_dates');
        if (blockedDatesJson) {
          const blockedDates = JSON.parse(blockedDatesJson).map(bd => ({
            start: new Date(bd.start),
            end: new Date(bd.end),
          }));
          
          // Merge with existing unavailable dates using functional update
          setUnavailable(prevUnavailable => {
            const existingRanges = prevUnavailable.map(r => normalizeRange(r.start, r.end));
            const newRanges = blockedDates.map(bd => normalizeRange(bd.start, bd.end));
            
            // Combine and merge all ranges
            const allRanges = [...existingRanges, ...newRanges];
            return mergeRanges(allRanges);
          });
        }
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const onSyncPress = () => {
    lightHaptic();
    navigation.navigate('CalendarSync');
  };

  const shiftMonth = (delta) => {
    const y = month.getFullYear();
    const m = month.getMonth();
    setMonth(new Date(y, m + delta, 1));
  };

  const selectedLabel = selectionStart ? fmtRange(selectionStart, selectionEnd || selectionStart) : 'No dates selected';

  // Merge consecutive blocked dates for display as ranges (e.g. "Mar 8 – Mar 17")
  const mergedBlockedForDisplay = useMemo(
    () => mergeConsecutiveBlockedRanges(unavailable),
    [unavailable]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 2, paddingBottom: 4 }]}>
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
        <Text style={styles.headerTitle}>Smart Calendar</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: SPACING.m }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Car Selector */}
          <View style={styles.carSelectorContainer}>
            <Text style={styles.carSelectorLabel}>Select Car</Text>
            {isLoadingCars ? (
              <AppLoader size="small" color={COLORS.text} />
            ) : (
              <TouchableOpacity
                style={styles.carSelectorButton}
                onPress={() => setIsCarPickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.carSelectorText} numberOfLines={1}>
                  {selectedCar 
                    ? `${selectedCar.name || 'Car'} ${selectedCar.model ? `• ${selectedCar.model}` : ''}`
                    : 'Select a car'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.text} />
              </TouchableOpacity>
            )}
          </View>

          {selectedCarId && isLoadingBlockedDates && (
            <View style={styles.loadingContainer}>
              <AppLoader size="small" color={COLORS.text} />
              <Text style={styles.loadingText}>Loading blocked dates...</Text>
            </View>
          )}

          {!selectedCarId && (
            <Text style={styles.helperText}>
              Please select a car to manage its calendar
            </Text>
          )}

          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.monthNav} onPress={() => shiftMonth(-1)} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={18} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{formatMonthYear(month)}</Text>

            <TouchableOpacity style={styles.monthNav} onPress={() => shiftMonth(1)} activeOpacity={0.8}>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={`${d}-${i}`} style={styles.weekDay}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {monthGrid.map((d, idx) => {
              const unavailableDay = isUnavailableDay(d);
              const selected = isSelectedDay(d);
              const isToday = d ? isSameDay(d, new Date()) : false;

              return (
                <TouchableOpacity
                  key={`${idx}-${d ? d.toISOString() : 'x'}`}
                  style={[
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                    unavailableDay && styles.dayCellUnavailable,
                  ]}
                  onPress={() => onDayPress(d)}
                  activeOpacity={0.85}
                  disabled={!d}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.dayTextSelected,
                      unavailableDay && styles.dayTextUnavailable,
                      isToday && !selected && !unavailableDay && styles.dayTextToday,
                    ]}
                  >
                    {d ? d.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.brand }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E5E5EA' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
          </View>

          <Text style={styles.selectionLabel}>{selectedLabel}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={clearSelection} activeOpacity={0.9}>
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dangerButton, (!selectedCarId || isBlocking) && styles.dangerButtonDisabled]} 
              onPress={unblockSelected} 
              activeOpacity={0.9}
              disabled={!selectedCarId || isBlocking}
            >
              {isBlocking ? (
                <AppLoader size="small" color={COLORS.danger} />
              ) : (
                <Text style={styles.dangerButtonText}>Unblock</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, (!selectedCarId || isBlocking) && styles.primaryButtonDisabled]} 
              onPress={blockSelected} 
              activeOpacity={0.9}
              disabled={!selectedCarId || isBlocking}
            >
              {isBlocking ? (
                <AppLoader size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Block</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            Tap a start date, then tap an end date to select a multi-day range. Use Block/Unblock to update availability.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Instant booking</Text>
              <Text style={styles.settingHint}>Allow guests to book without approval.</Text>
            </View>
            <Switch
              value={instantBooking}
              onValueChange={setInstantBooking}
              trackColor={{ false: '#D1D1D6', true: '#A7D7FF' }}
              thumbColor={instantBooking ? COLORS.brand : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Buffer time</Text>
              <Text style={styles.settingHint}>Automatically add time between rentals.</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setBufferHours((h) => Math.max(0, h - 1))}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={18} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{bufferHours}h</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setBufferHours((h) => Math.min(12, h + 1))}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.syncRow} onPress={onSyncPress} activeOpacity={0.85}>
            <View style={styles.syncLeft}>
              <View style={styles.syncLabelRow}>
                <Text style={styles.settingLabel}>Sync with personal calendar</Text>
                {syncEnabled && (
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.settingHint}>
                {syncEnabled 
                  ? 'Calendar sync is enabled. Events will block dates automatically.'
                  : 'Connect Google/Apple calendar to auto-block dates.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginBottom: SPACING.xl }]}
        >
          <Text style={styles.sectionTitle}>Blocked dates</Text>
          {!selectedCarId ? (
            <Text style={styles.helperText}>Select a car to view blocked dates</Text>
          ) : mergedBlockedForDisplay.length === 0 ? (
            <Text style={styles.helperText}>No blocked dates yet.</Text>
          ) : (
            mergedBlockedForDisplay.map((r, i) => (
              <TouchableOpacity
                key={`${i}-${startOfDay(r.start).getTime()}-${r.ids.length}`}
                style={styles.blockedRow}
                onPress={() => {
                  const carId = selectedCarId;
                  const idsToUnblock = r.ids || [];
                  if (idsToUnblock.length === 0 || !carId) return;
                  Alert.alert(
                    'Unblock dates',
                    `Remove blocked period: ${fmtRange(r.start, r.end)}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Unblock',
                        style: 'destructive',
                        onPress: async () => {
                          setIsBlocking(true);
                          try {
                            const results = await Promise.all(
                              idsToUnblock.map((id) => unblockCarDate(carId, id))
                            );
                            const allOk = results.every((res) => res.success);
                            if (allOk) {
                              await loadBlockedDates();
                              Alert.alert('Success', 'Dates unblocked successfully');
                            } else {
                              const err = results.find((res) => !res.success);
                              Alert.alert('Error', err?.error || 'Failed to unblock');
                            }
                          } catch (error) {
                            console.error('Error unblocking date:', error);
                            Alert.alert('Error', 'Failed to unblock. Please try again.');
                          } finally {
                            setIsBlocking(false);
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.blockedRowLeft}>
                  <Text style={styles.blockedText}>{fmtRange(r.start, r.end)}</Text>
                </View>
                <Ionicons name="close-circle" size={18} color={COLORS.subtle} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Car Picker Modal */}
      <Modal
        visible={isCarPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCarPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Car</Text>
              <TouchableOpacity
                onPress={() => setIsCarPickerVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {cars.length === 0 ? (
                <Text style={styles.modalEmptyText}>No cars available</Text>
              ) : (
                cars.map((car) => (
                  <TouchableOpacity
                    key={car.id}
                    style={[
                      styles.carOption,
                      selectedCarId === car.id && styles.carOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedCarId(car.id);
                      setSelectedCar(car);
                      setIsCarPickerVisible(false);
                      lightHaptic();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.carOptionContent}>
                      <Text style={styles.carOptionName}>
                        {car.name || 'Car'} {car.model ? `• ${car.model}` : ''}
                      </Text>
                      {car.year && (
                        <Text style={styles.carOptionYear}>{car.year}</Text>
                      )}
                    </View>
                    {selectedCarId === car.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.brand} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
    gap: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  monthNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...TYPE.section,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
    paddingHorizontal: 2,
  },
  weekDay: {
    width: 38,
    textAlign: 'center',
    ...TYPE.micro,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.bg,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.35)',
  },
  dayCellUnavailable: {
    backgroundColor: 'rgba(255, 45, 85, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.28)',
  },
  dayText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
  },
  dayTextSelected: {
    color: COLORS.brand,
  },
  dayTextUnavailable: {
    color: COLORS.danger,
  },
  dayTextToday: {
    textDecorationLine: 'underline',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...TYPE.caption,
  },
  selectionLabel: {
    ...TYPE.bodyStrong,
    marginTop: SPACING.m,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.m,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  secondaryButtonText: {
    ...TYPE.section,
    color: COLORS.text,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 45, 85, 0.14)',
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 45, 85, 0.22)',
  },
  dangerButtonText: {
    ...TYPE.section,
    color: COLORS.danger,
  },
  helperText: {
    ...TYPE.caption,
    marginTop: SPACING.m,
  },
  sectionTitle: {
    ...TYPE.section,
    marginBottom: SPACING.m,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  settingLeft: {
    flex: 1,
    paddingRight: SPACING.m,
  },
  settingLabel: {
    ...TYPE.bodyStrong,
  },
  settingHint: {
    ...TYPE.caption,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    height: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...TYPE.bodyStrong,
    minWidth: 34,
    textAlign: 'center',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  syncLeft: {
    flex: 1,
    paddingRight: SPACING.m,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  blockedText: {
    ...TYPE.body,
    color: COLORS.text,
  },
  syncLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncBadgeText: {
    ...TYPE.micro,
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
  },
  carSelectorContainer: {
    marginBottom: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  carSelectorLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: 8,
  },
  carSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    paddingHorizontal: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  carSelectorText: {
    ...TYPE.bodyStrong,
    flex: 1,
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    gap: 8,
  },
  loadingText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  dangerButtonDisabled: {
    opacity: 0.5,
  },
  blockedRowLeft: {
    flex: 1,
  },
  blockedReason: {
    ...TYPE.caption,
    color: COLORS.subtle,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPE.section,
    fontSize: 18,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalEmptyText: {
    ...TYPE.body,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
    color: COLORS.subtle,
  },
  carOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  carOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  carOptionContent: {
    flex: 1,
  },
  carOptionName: {
    ...TYPE.bodyStrong,
    fontSize: 15,
  },
  carOptionYear: {
    ...TYPE.caption,
    color: COLORS.subtle,
    marginTop: 2,
  },
});
