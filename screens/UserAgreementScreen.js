import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const UserAgreementScreen = () => {
  const navigation = useNavigation();

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <TouchableOpacity 
        style={styles.floatingBackButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#000000" />
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>User Agreement</Text>
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
    backgroundColor: '#ffffff',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    marginBottom: 8,
    color: '#000000',
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    marginBottom: 32,
    color: '#999999',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
    color: '#000000',
  },
  sectionContent: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    lineHeight: 24,
    color: '#666666',
  },
});

export default UserAgreementScreen;
