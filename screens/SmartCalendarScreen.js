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
  const [blockedDatesData, setBlockedDatesData] = useState([]);

  const [instantBooking, setInstantBooking] = useState(false);
  const [bufferHours, setBufferHours] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(false);

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
    const startWeekday = first.getDay();

    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
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
      if (!selectedCarId) Alert.alert('Select Car', 'Please select a car first to manage its calendar');
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

    setIsBlocking(true);
    try {
      const startMs = startOfDay(range.start).getTime();
      const endMs = startOfDay(range.end).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const daysToBlock = Math.round((endMs - startMs) / oneDayMs) + 1;

      if (daysToBlock <= 0) { setIsBlocking(false); return; }

      let allOk = true;
      let lastError = null;

      for (let i = 0; i < daysToBlock; i += 1) {
        const dayStart = new Date(startMs + i * oneDayMs);
        const dayEnd = new Date(startMs + i * oneDayMs);
        const result = await blockCarDates(selectedCarId, startOfDay(dayStart).toISOString(), startOfDay(dayEnd).toISOString());
        if (!result.success) { allOk = false; lastError = result.error; }
      }

      if (allOk) {
        await loadBlockedDates();
        clearSelection();
        Alert.alert('Done', daysToBlock === 1 ? 'Date blocked' : `${daysToBlock} dates blocked`);
      } else {
        Alert.alert('Error', lastError || 'Failed to block some dates');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to block dates. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockSelected = async () => {
    if (!selectedCarId) { Alert.alert('Error', 'Please select a car first'); return; }
    if (!selectionStart) {
      Alert.alert('Select dates', 'Tap a start date, then an end date to select the range to unblock.');
      return;
    }

    const end = selectionEnd || selectionStart;
    const sel = normalizeRange(selectionStart, end);

    const overlappingBlockedDates = blockedDatesData.filter((bd) => {
      const bdStart = startOfDay(new Date(bd.start_date));
      const bdEnd = startOfDay(new Date(bd.end_date));
      return rangesOverlap({ start: bdStart, end: bdEnd }, sel);
    });

    if (overlappingBlockedDates.length === 0) {
      Alert.alert('Info', 'No blocked dates in the selected range');
      return;
    }

    setIsBlocking(true);
    try {
      const results = await Promise.all(
        overlappingBlockedDates.map((bd) => unblockCarDate(selectedCarId, bd.id || bd.blocked_date_id))
      );
      if (results.every((r) => r.success)) {
        await loadBlockedDates();
        clearSelection();
        Alert.alert('Done', 'Dates unblocked');
      } else {
        const errors = results.filter((r) => !r.success).map((r) => r.error);
        Alert.alert('Error', errors.join('\n') || 'Failed to unblock some dates');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unblock dates. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  useEffect(() => { loadCars(); }, []);

  useEffect(() => {
    if (selectedCarId) {
      loadBlockedDates();
    } else {
      setUnavailable([]);
      setBlockedDatesData([]);
    }
  }, [selectedCarId]);

  // Only reload sync status on focus — blocked dates load when car is selected
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSyncStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCars = async () => {
    setIsLoadingCars(true);
    try {
      const result = await getHostCars({ summary: true });
      if (result.success && result.cars) {
        setCars(result.cars);
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
        const blockedDatesJson = await AsyncStorage.getItem('@calendar_blocked_dates');
        if (blockedDatesJson) {
          const blockedDates = JSON.parse(blockedDatesJson).map((bd) => ({
            start: new Date(bd.start),
            end: new Date(bd.end),
          }));
          setUnavailable((prevUnavailable) => {
            const allRanges = [
              ...prevUnavailable.map((r) => normalizeRange(r.start, r.end)),
              ...blockedDates.map((bd) => normalizeRange(bd.start, bd.end)),
            ];
            return mergeRanges(allRanges);
          });
        }
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const onSyncPress = () => { lightHaptic(); navigation.navigate('CalendarSync'); };
  const shiftMonth = (delta) => {
    const y = month.getFullYear();
    const m = month.getMonth();
    setMonth(new Date(y, m + delta, 1));
  };

  const selectedLabel = selectionStart ? fmtRange(selectionStart, selectionEnd || selectionStart) : null;

  const mergedBlockedForDisplay = useMemo(
    () => mergeConsecutiveBlockedRanges(unavailable),
    [unavailable]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 2 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => { lightHaptic(); navigation.goBack(); }} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Calendar</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Car selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Vehicle</Text>
          {isLoadingCars ? (
            <View style={styles.loaderRow}>
              <AppLoader size="small" color={COLORS.brand} />
            </View>
          ) : (
            <TouchableOpacity style={styles.carRow} onPress={() => setIsCarPickerVisible(true)} activeOpacity={0.7}>
              <Text style={styles.carRowText} numberOfLines={1}>
                {selectedCar
                  ? `${selectedCar.name || 'Car'}${selectedCar.model ? ` · ${selectedCar.model}` : ''}`
                  : 'Select a car'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.subtle} />
            </TouchableOpacity>
          )}
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.monthNavBtn} onPress={() => shiftMonth(-1)} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthYear(month)}</Text>
            <TouchableOpacity style={styles.monthNavBtn} onPress={() => shiftMonth(1)} activeOpacity={0.8}>
              <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={`${d}-${i}`} style={styles.weekDay}>{d}</Text>
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
                  <Text style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    unavailableDay && styles.dayTextUnavailable,
                    isToday && !selected && !unavailableDay && styles.dayTextToday,
                  ]}>
                    {d ? d.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isLoadingBlockedDates && (
            <View style={styles.loaderRow}>
              <AppLoader size="small" color={COLORS.brand} />
            </View>
          )}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.brand }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
          </View>

          {selectedLabel ? (
            <Text style={styles.selectionLabel}>{selectedLabel}</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={clearSelection} activeOpacity={0.9}>
              <Text style={styles.ghostBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.outlineBtn, (!selectedCarId || isBlocking) && styles.btnDisabled]}
              onPress={unblockSelected}
              activeOpacity={0.9}
              disabled={!selectedCarId || isBlocking}
            >
              {isBlocking
                ? <AppLoader size="small" color={COLORS.danger} />
                : <Text style={styles.outlineBtnText}>Unblock</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.solidBtn, (!selectedCarId || isBlocking) && styles.btnDisabled]}
              onPress={blockSelected}
              activeOpacity={0.9}
              disabled={!selectedCarId || isBlocking}
            >
              {isBlocking
                ? <AppLoader size="small" color="#FFF" />
                : <Text style={styles.solidBtnText}>Block</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Tap a start date, then tap an end date to select a range.</Text>
        </View>

        {/* Booking settings */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Booking Settings</Text>

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
              <Text style={styles.settingHint}>Add time between rentals.</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setBufferHours((h) => Math.max(0, h - 1))} activeOpacity={0.85}>
                <Ionicons name="remove" size={16} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{bufferHours}h</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setBufferHours((h) => Math.min(12, h + 1))} activeOpacity={0.85}>
                <Ionicons name="add" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={onSyncPress} activeOpacity={0.85}>
            <View style={styles.settingLeft}>
              <View style={styles.syncLabelRow}>
                <Text style={styles.settingLabel}>Calendar sync</Text>
                {syncEnabled && (
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.settingHint}>
                {syncEnabled
                  ? 'Synced — events block dates automatically.'
                  : 'Connect Google/Apple calendar.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
          </TouchableOpacity>
        </View>

        {/* Blocked dates */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Blocked Dates</Text>
          {!selectedCarId ? (
            <Text style={styles.hint}>Select a car to view blocked dates.</Text>
          ) : mergedBlockedForDisplay.length === 0 ? (
            <Text style={styles.hint}>No blocked dates yet.</Text>
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
                            if (results.every((res) => res.success)) {
                              await loadBlockedDates();
                              Alert.alert('Done', 'Dates unblocked');
                            } else {
                              const err = results.find((res) => !res.success);
                              Alert.alert('Error', err?.error || 'Failed to unblock');
                            }
                          } catch (error) {
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
                <Text style={styles.blockedText}>{fmtRange(r.start, r.end)}</Text>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.subtle} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Car picker modal */}
      <Modal
        visible={isCarPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCarPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={() => setIsCarPickerVisible(false)} style={styles.iconBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {cars.length === 0 ? (
                <Text style={styles.hint}>No cars available.</Text>
              ) : (
                cars.map((car) => (
                  <TouchableOpacity
                    key={car.id}
                    style={[styles.carOption, selectedCarId === car.id && styles.carOptionActive]}
                    onPress={() => { setSelectedCarId(car.id); setSelectedCar(car); setIsCarPickerVisible(false); lightHaptic(); }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.carOptionName}>
                        {car.name || 'Car'}{car.model ? ` · ${car.model}` : ''}
                      </Text>
                      {car.year ? <Text style={styles.carOptionYear}>{car.year}</Text> : null}
                    </View>
                    {selectedCarId === car.id && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.brand} />
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
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.section, fontSize: 16, color: COLORS.text },
  content: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl, gap: SPACING.m },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    padding: SPACING.m,
    backgroundColor: COLORS.bg,
  },
  sectionLabel: {
    ...TYPE.micro,
    fontSize: 11,
    color: COLORS.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  loaderRow: { alignItems: 'center', paddingVertical: 12 },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  carRowText: { ...TYPE.bodyStrong, fontSize: 15, color: COLORS.text, flex: 1, marginRight: 8 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  monthNavBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { ...TYPE.bodyStrong, fontSize: 15, color: COLORS.text },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekDay: { width: 38, textAlign: 'center', ...TYPE.micro, color: COLORS.subtle },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  dayCellUnavailable: {
    backgroundColor: 'rgba(255,45,85,0.1)',
  },
  dayText: { ...TYPE.body, fontSize: 13, color: COLORS.text },
  dayTextSelected: { color: COLORS.brand, fontFamily: 'Nunito-SemiBold' },
  dayTextUnavailable: { color: COLORS.danger },
  dayTextToday: { textDecorationLine: 'underline' },
  legendRow: { flexDirection: 'row', gap: 20, marginTop: 10, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { ...TYPE.caption, color: COLORS.subtle },
  selectionLabel: { ...TYPE.bodyStrong, fontSize: 13, color: COLORS.text, marginTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ghostBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  ghostBtnText: { ...TYPE.body, fontSize: 14, color: COLORS.muted },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.3)',
    backgroundColor: 'rgba(255,45,85,0.06)',
  },
  outlineBtnText: { ...TYPE.bodyStrong, fontSize: 14, color: COLORS.danger },
  solidBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
  },
  solidBtnText: { ...TYPE.bodyStrong, fontSize: 14, color: '#FFF' },
  btnDisabled: { opacity: 0.4 },
  hint: { ...TYPE.caption, color: COLORS.subtle, marginTop: 8, lineHeight: 18 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  settingLeft: { flex: 1, paddingRight: SPACING.m },
  settingLabel: { ...TYPE.bodyStrong, fontSize: 14 },
  settingHint: { ...TYPE.caption, marginTop: 2, color: COLORS.subtle },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 4,
    height: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  stepperBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { ...TYPE.bodyStrong, minWidth: 30, textAlign: 'center', fontSize: 13 },
  syncLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncBadge: { backgroundColor: '#34C759', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  syncBadgeText: { ...TYPE.micro, color: '#FFF', fontSize: 10, fontFamily: 'Nunito-SemiBold' },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  blockedText: { ...TYPE.body, fontSize: 14, color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: SPACING.xl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: { ...TYPE.section, fontSize: 15 },
  modalScroll: { maxHeight: 380 },
  carOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  carOptionActive: { backgroundColor: 'rgba(0,122,255,0.06)' },
  carOptionName: { ...TYPE.bodyStrong, fontSize: 15 },
  carOptionYear: { ...TYPE.caption, color: COLORS.subtle, marginTop: 2 },
});
