import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using the OpaHost platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.',
    },
    {
      title: '2. Platform Services',
      content: 'OpaHost provides a platform for car rental hosting, connecting car owners with renters through a secure marketplace.',
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
      content: 'OpaHost provides the platform "as is" and does not guarantee uninterrupted or error-free service.',
    },
    {
      title: '8. Modifications to Terms',
      content: 'OpaHost reserves the right to modify these terms at any time. Users will be notified of significant changes.',
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
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
        <Text style={styles.mainTitle}>Terms of Service</Text>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

export default TermsOfServiceScreen;
