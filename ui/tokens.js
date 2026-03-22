export const COLORS = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#0B0B0F',
  muted: '#4A4A4A',
  subtle: '#6A6A6A',
  border: '#EFEFEF',
  borderStrong: '#E5E5E5',
  /** Use for outline “cards” on COLORS.bg — hairline + borderStrong disappears on gray */
  borderVisible: '#C7C7CC',
  brand: '#007AFF',
  danger: '#FF2D55',
  /** Subscription / renewal countdown accent */
  countdownOrange: '#EA580C',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

export const RADIUS = {
  card: 16,
  lg: 18,
  button: 28,
  pill: 999,
};

export const TYPE = {
  largeTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  section: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Nunito-Regular',
    color: COLORS.muted,
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.subtle,
  },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.subtle,
  },
};

// Platform fee percentage (apples fee)
export const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee

// Calculate minimum security deposit (at least 45% higher than car value including fees)
export const calculateMinSecurityDeposit = (carValue) => {
  if (!carValue || carValue === '') return 0;
  const value = parseFloat(carValue);
  if (isNaN(value)) return 0;
  // 45% higher means 1.45x the car value
  return Math.ceil(value * 1.45);
};