import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

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

export default function SmartCalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  const [unavailable, setUnavailable] = useState([
    // sample
    // { start: new Date(2025, 11, 26), end: new Date(2025, 11, 28) },
  ]);

  const [instantBooking, setInstantBooking] = useState(false);
  const [bufferHours, setBufferHours] = useState(0);

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
    if (!d) return;

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

  const blockSelected = () => {
    if (!selectionStart) return;
    const end = selectionEnd || selectionStart;
    const next = mergeRanges([...unavailable, normalizeRange(selectionStart, end)]);
    setUnavailable(next);
    clearSelection();
  };

  const unblockSelected = () => {
    if (!selectionStart) return;
    const end = selectionEnd || selectionStart;
    const sel = normalizeRange(selectionStart, end);

    // remove any ranges that overlap selection by splitting
    const next = [];
    for (const r of unavailable) {
      if (!rangesOverlap(r, sel)) {
        next.push(r);
        continue;
      }

      const rN = normalizeRange(r.start, r.end);
      const s = startOfDay(sel.start).getTime();
      const e = startOfDay(sel.end).getTime();
      const rS = startOfDay(rN.start).getTime();
      const rE = startOfDay(rN.end).getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      // left remainder
      if (rS < s) {
        next.push({ start: new Date(rS), end: new Date(s - oneDay) });
      }
      // right remainder
      if (rE > e) {
        next.push({ start: new Date(e + oneDay), end: new Date(rE) });
      }
    }

    setUnavailable(mergeRanges(next));
    clearSelection();
  };

  const onSyncPress = () => {
    Alert.alert('Coming soon', 'Calendar sync will be available in a future update.');
  };

  const shiftMonth = (delta) => {
    const y = month.getFullYear();
    const m = month.getMonth();
    setMonth(new Date(y, m + delta, 1));
  };

  const selectedLabel = selectionStart ? fmtRange(selectionStart, selectionEnd || selectionStart) : 'No dates selected';

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Smart Calendar</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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

            <TouchableOpacity style={styles.dangerButton} onPress={unblockSelected} activeOpacity={0.9}>
              <Text style={styles.dangerButtonText}>Unblock</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={blockSelected} activeOpacity={0.9}>
              <Text style={styles.primaryButtonText}>Block</Text>
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
              <Text style={styles.settingLabel}>Sync with personal calendar</Text>
              <Text style={styles.settingHint}>Connect Google/Apple calendar.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginBottom: SPACING.xl }]}
        >
          <Text style={styles.sectionTitle}>Blocked dates</Text>
          {unavailable.length === 0 ? (
            <Text style={styles.helperText}>No blocked dates yet.</Text>
          ) : (
            unavailable.map((r, i) => (
              <View key={`${i}-${startOfDay(r.start).toISOString()}`} style={styles.blockedRow}>
                <Text style={styles.blockedText}>{fmtRange(r.start, r.end)}</Text>
                <Ionicons name="close-circle" size={18} color={COLORS.subtle} />
              </View>
            ))
          )}
        </View>
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
});
