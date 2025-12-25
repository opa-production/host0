import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const LegalScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >

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
            <Ionicons name="globe-outline" size={20} color="#007AFF" />
            <Text style={styles.websiteButtonText}>opa.deonhq.xyz</Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
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
            <Ionicons name="mail-outline" size={20} color="#007AFF" />
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    marginBottom: 12,
    color: '#1C1C1E',
  },
  sectionContent: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    color: '#8E8E93',
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    textDecorationLine: 'underline',
    color: '#007AFF',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
  websiteButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#007AFF',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#007AFF',
  },
});

export default LegalScreen;
