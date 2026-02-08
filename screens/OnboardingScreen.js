import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import SavingsSvg from '../assets/icons/savings.svg';
import ControlSvg from '../assets/icons/control.svg';
import SafetySvg from '../assets/icons/safety.svg';
import WelcomeSvg from '../assets/icons/welcome.svg';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'income',
    title: 'Turn your car into income',
    description: 'Ardena lets you list your car and earn from it without stress. No chasing renters, no confusion just a clear, structured way to make money from what you already own.',
    Icon: SavingsSvg
  },
  {
    key: 'control',
    title: 'You stay in control',
    description: 'Set your availability, pricing, and rules. Accept or decline requests, track bookings, and always know where your car is and who is using it.',
    Icon: ControlSvg
  },
  {
    key: 'safety',
    title: 'Safety comes first',
    description: 'Every renter is verified, every booking is tracked, and support is always available. Your car is protected, and you\'re never left guessing.',
    Icon: SafetySvg
  },
  {
    key: 'welcome',
    title: 'Welcome to Ardena Host',
    description: 'List your car, earn with confidence, and join a trusted community of car owners building the future of car rentals.',
    Icon: WelcomeSvg
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    lightHaptic();
    if (current === slides.length - 1) {
      navigation.replace('Landing');
    } else {
      setCurrent((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    lightHaptic();
    if (current > 0) {
      setCurrent((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    lightHaptic();
    navigation.replace('Landing');
  };

  const slide = slides[current];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={[styles.topRow, { paddingTop: insets.top + SPACING.m }]}>
        <View style={styles.topRowSpacer} />
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={1}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <slide.Icon width={200} height={200} style={styles.icon} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}>
        <View style={styles.buttonContainer}>
          {current > 0 && (
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={handlePrev}
              activeOpacity={1}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
          
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
              activeOpacity={1}
            >
              <Ionicons 
                name={current === slides.length - 1 ? 'checkmark' : 'arrow-forward'} 
                size={20} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.l,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.m,
  },
  topRowSpacer: {
    width: 48,
  },
  skipButton: {
    padding: SPACING.m,
    marginRight: -SPACING.s,
  },
  skipText: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
    fontSize: 16,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: SPACING.xl * 2,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  icon: {
    maxWidth: '80%',
    height: 200,
  },
  title: {
    ...TYPE.largeTitle,
    marginBottom: SPACING.m,
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 38,
  },
  description: {
    ...TYPE.body,
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    paddingVertical: SPACING.l,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonContainer: {
    marginLeft: 'auto',
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
