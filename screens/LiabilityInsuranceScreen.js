import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LiabilityInsuranceScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const sections = [
    {
      title: 'Insurance Coverage',
      content: 'OpaHost provides comprehensive insurance coverage for all vehicle rentals through our platform. This includes third-party liability, comprehensive coverage for vehicle damage, and protection for both car owners and renters.',
    },
    {
      title: 'Car Owner Protection',
      content: 'Car owners are protected against damage, theft, and liability claims during rental periods. Our insurance covers repairs, replacement costs, and legal expenses.',
    },
    {
      title: 'Renter Protection',
      content: 'Renters are covered for third-party liability and damage to the rental vehicle. The insurance includes collision coverage, theft protection, and personal accident coverage.',
    },
    {
      title: 'Damage Reporting',
      content: 'Any damage or incidents must be reported immediately through the app. Both owners and renters should document damage with photos and detailed descriptions.',
    },
    {
      title: 'Liability Limitations',
      content: 'OpaHost is not liable for damages resulting from user negligence, illegal activities, or violations of traffic laws. Users are responsible for their own actions.',
    },
    {
      title: 'Exclusions',
      content: 'Insurance does not cover damages from racing, off-road use, driving under the influence, unlicensed drivers, or use outside of Kenya without prior authorization.',
    },
    {
      title: 'Claims Process',
      content: 'To file a claim, submit a report through the app with photos, documentation, and a detailed description. Our insurance team will review the claim within 48 hours.',
    },
    {
      title: 'Deductibles and Fees',
      content: 'Deductibles apply to certain types of claims as specified in the rental agreement. These amounts vary based on the vehicle value and type of damage.',
    },
    {
      title: 'Service Provider Insurance',
      content: 'Professional service providers must maintain their own professional liability insurance. OpaHost provides platform liability coverage.',
    },
    {
      title: 'Legal Compliance',
      content: 'All insurance coverage complies with Kenyan insurance regulations. Users must ensure they meet all legal requirements for vehicle operation.',
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
        <Text style={styles.mainTitle}>Liability & Insurance</Text>
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

export default LiabilityInsuranceScreen;
