import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../ui/tokens';

/** Use for every listing TextInput `placeholderTextColor` so tone matches Nunito fields */
export const hostVehiclePlaceholderColor = COLORS.subtle;

/** Outer form frame — darker than COLORS.borderVisible */
export const hostVehicleFormOutlineColor = '#949499';

/** Field underlines, dividers, inner rules — between old borderStrong and borderVisible */
export const hostVehicleInputRuleColor = '#A6A6AC';

const fieldFontFix = Platform.select({
  android: { includeFontPadding: false },
  default: {},
});

/**
 * Listing flow — full white screen; one outlined form group; inputs are bottom lines only.
 */
export const hostVehicleFormShared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    flexGrow: 1,
  },
  /** Single box around the form (hairline), not around each field */
  formOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hostVehicleFormOutlineColor,
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
    marginBottom: SPACING.l,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  /** Primary actions at bottom of form outline */
  formActions: {
    marginTop: SPACING.m,
    paddingTop: SPACING.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: hostVehicleInputRuleColor,
  },
  inputSection: {
    paddingBottom: SPACING.m,
  },
  field: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    paddingTop: 4,
    paddingBottom: 10,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
    backgroundColor: 'transparent',
    ...fieldFontFix,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
  },
  /** Multiline: same as field — line only, no fill */
  fieldArea: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    marginTop: 4,
    minHeight: 96,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
    backgroundColor: 'transparent',
    ...fieldFontFix,
  },
  /** Between major blocks inside the same outline (e.g. media) */
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: hostVehicleInputRuleColor,
    marginTop: SPACING.s,
    marginBottom: SPACING.m,
  },
});
