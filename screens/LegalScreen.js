import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LegalScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const legalSections = [
    {
      title: 'Terms of Service',
      content: 'By using OpaHost, you agree to our Terms of Service. These terms govern your use of our platform, including vehicle rentals, service bookings, and all interactions on the platform. Please read these terms carefully before using our services.',
      screenName: 'TermsOfService',
    },
    {
      title: 'User Agreement',
      content: 'Our User Agreement outlines the rights and responsibilities of both car owners and renters on the OpaHost platform. This includes booking policies, payment terms, cancellation procedures, and dispute resolution processes.',
      screenName: 'UserAgreement',
    },
    {
      title: 'Liability & Insurance',
      content: 'OpaHost provides comprehensive insurance coverage for all rentals. Car owners and renters are protected through our insurance policies. However, users are responsible for following all traffic laws and using vehicles responsibly.',
      screenName: 'LiabilityInsurance',
    },
    {
      title: 'Intellectual Property',
      content: 'All content on the OpaHost platform, including logos, designs, text, graphics, and software, is the property of OpaHost and protected by copyright and trademark laws.',
      screenName: 'IntellectualProperty',
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Legal</Text>
        </View>

        {/* Legal Sections */}
        {legalSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={() => {
                // Check if screen exists before navigating
                try {
                  navigation.navigate(section.screenName);
                } catch (e) {
                  console.log(`Screen ${section.screenName} not found`);
                }
              }}
              activeOpacity={1}
            >
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Legal Website Link */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Information</Text>
          <Text style={styles.sectionContent}>
            For complete legal information, terms, and policies, please visit our legal website.
          </Text>
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => handleLinkPress('https://opa.deonhq.xyz')}
            activeOpacity={1}
          >
            <Ionicons name="globe-outline" size={20} color="#FF1577" />
            <Text style={styles.websiteButtonText}>opa.deonhq.xyz</Text>
            <Ionicons name="open-outline" size={16} color="#FF1577" />
          </TouchableOpacity>
        </View>

        {/* Contact for Legal Inquiries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Inquiries</Text>
          <Text style={styles.sectionContent}>
            For legal inquiries or questions about our terms and policies, please contact our legal team.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleLinkPress('mailto:legal@opahost.com')}
            activeOpacity={1}
          >
            <Ionicons name="mail-outline" size={20} color="#FF1577" />
            <Text style={styles.contactButtonText}>legal@opahost.com</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
    color: '#000000',
  },
  sectionContent: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    lineHeight: 24,
    marginBottom: 12,
    color: '#666666',
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    textDecorationLine: 'underline',
    color: '#FF1577',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF157750',
    backgroundColor: '#FF157710',
    alignSelf: 'flex-start',
  },
  websiteButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF1577',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF157750',
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF1577',
  },
});

export default LegalScreen;
