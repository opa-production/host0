import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const UserAgreementScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const sections = [
    {
      title: 'Agreement Overview',
      content: 'This User Agreement establishes the relationship between OpaHost and its users, including car owners, renters, and service providers. By using our platform, you agree to the terms outlined in this agreement.',
    },
    {
      title: 'Car Owner Responsibilities',
      content: 'Car owners must provide accurate vehicle information, maintain vehicles in safe and roadworthy condition, ensure proper insurance coverage, and respond promptly to booking requests.',
    },
    {
      title: 'Renter Responsibilities',
      content: 'Renters must have a valid driver\'s license, meet age requirements, provide accurate personal information, and use vehicles responsibly.',
    },
    {
      title: 'Booking Policies',
      content: 'Bookings are confirmed upon payment. Cancellation policies vary: free cancellation within 24 hours of booking, partial refunds for cancellations made 48 hours before pickup.',
    },
    {
      title: 'Payment Terms',
      content: 'All payments are processed securely through our platform. Renters pay upfront, and owners receive payment after the rental period ends, minus platform fees.',
    },
    {
      title: 'Cancellation Procedures',
      content: 'Cancellations must be made through the app. Refunds are processed automatically according to the cancellation policy.',
    },
    {
      title: 'Dispute Resolution',
      content: 'In case of disputes between users, OpaHost provides a dispute resolution process. Users should first attempt to resolve issues directly.',
    },
    {
      title: 'Service Provider Terms',
      content: 'Service providers must maintain proper licenses, insurance, and qualifications. They are responsible for the quality of their services.',
    },
    {
      title: 'User Conduct',
      content: 'All users must treat each other with respect and professionalism. Harassment, discrimination, fraud, or any illegal activities are strictly prohibited.',
    },
    {
      title: 'Account Management',
      content: 'Users can update their profiles, payment methods, and preferences at any time. Account deletion requests are processed within 30 days.',
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
        <Text style={styles.headerTitle}>User Agreement</Text>
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

export default UserAgreementScreen;
