import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AboutScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const aboutSections = [
    {
      title: 'About OpaHost',
      content: 'OpaHost is a trusted platform for hosting car rentals. We provide a comprehensive ecosystem for managing your fleet, connecting with renters, and growing your car rental business.',
    },
    {
      title: 'Our Mission',
      content: 'Our mission is to revolutionize car rental hosting by creating a platform that empowers car owners to monetize their assets while providing renters with reliable and diverse mobility options.',
    },
    {
      title: 'What We Offer',
      items: [
        'Fleet Management: Easy-to-use tools to manage your car rental business',
        'Analytics: Track your business performance and insights',
        'Secure Payments: Multiple payment options with transparent pricing',
        '24/7 Support: Round-the-clock customer service',
        'Verified Network: Connect with verified renters and partners',
      ],
    },
  ];

  const contactInfo = [
    { icon: 'mail-outline', label: 'Email', value: 'support@opahost.com', action: () => handleLinkPress('mailto:support@opahost.com') },
    { icon: 'call-outline', label: 'Phone', value: '+254 7022 48 984', action: () => handleLinkPress('tel:+254702248984') },
    { icon: 'globe-outline', label: 'Website', value: 'opa.deonhq.xyz', action: () => handleLinkPress('https://opa.deonhq.xyz') },
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
        {/* App Logo/Title Section */}
        <View style={styles.headerSection}>
          <Text style={styles.appTitle}>OpaHost</Text>
          <Text style={styles.appTagline}>
            Premium Car Rental Hosting Platform
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* About Sections */}
        {aboutSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content && (
              <Text style={styles.sectionContent}>{section.content}</Text>
            )}
            {section.items && (
              <View style={styles.itemsList}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.itemRow}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FF1577" />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {contactInfo.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactItem}
              onPress={contact.action}
              activeOpacity={0.7}
            >
              <Ionicons name={contact.icon} size={22} color="#FF1577" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Text style={styles.contactValue}>{contact.value}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Copyright */}
        <View style={styles.footerSection}>
          <Text style={styles.copyrightText}>
            © 2024 OpaHost. All rights reserved.
          </Text>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 42,
    fontFamily: 'Nunito-Bold',
    marginBottom: 8,
    color: '#FF1577',
  },
  appTagline: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    color: '#666666',
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
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
    color: '#666666',
  },
  itemsList: {
    gap: 12,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    flex: 1,
    lineHeight: 22,
    color: '#666666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginBottom: 4,
    color: '#999999',
  },
  contactValue: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    color: '#999999',
  },
});

export default AboutScreen;
