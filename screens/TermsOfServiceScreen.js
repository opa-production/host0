import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using the Ardena Host platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.',
    },
    {
      title: '2. Platform Services',
      content: 'Ardena Host provides a platform for car rental hosting, connecting car owners with renters through a secure marketplace.',
    },
    {
      title: '3. User Accounts',
      content: 'To use our platform, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials.',
    },
    {
      title: '4. Vehicle Rentals',
      content: 'Car owners are responsible for ensuring their vehicles are in safe, roadworthy condition and properly insured. Renters must have a valid driver\'s license and meet all requirements.',
    },
    {
      title: '5. Booking and Payments',
      content: 'All bookings are subject to availability and confirmation. Payment must be made through our secure payment system.',
    },
    {
      title: '6. Prohibited Activities',
      content: 'Users are prohibited from using the platform for illegal activities, fraud, or any purpose that violates these terms.',
    },
    {
      title: '7. Liability and Disclaimers',
      content: 'Ardena Host provides the platform "as is" and does not guarantee uninterrupted or error-free service.',
    },
    {
      title: '8. Modifications to Terms',
      content: 'Ardena Host reserves the right to modify these terms at any time. Users will be notified of significant changes.',
    },
    {
      title: '9. Termination',
      content: 'We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities.',
    },
    {
      title: '10. Governing Law',
      content: 'These terms are governed by the laws of Kenya. Any disputes will be resolved through arbitration.',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: January 2024</Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  lastUpdated: {
    ...TYPE.body,
    fontSize: 13,
    marginBottom: 24,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 17,
    marginBottom: 8,
    color: '#1C1C1E',
  },
  sectionContent: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
  },
});

export default TermsOfServiceScreen;
