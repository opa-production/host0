import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const AboutScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleLinkPress = (url) => {
    lightHaptic();
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const contactInfo = [
    { icon: 'mail-outline', label: 'Email', value: 'support@opahost.com', action: () => handleLinkPress('mailto:support@opahost.com') },
    { icon: 'call-outline', label: 'Phone', value: '+254 7022 48 984', action: () => handleLinkPress('tel:+254702248984') },
    { icon: 'globe-outline', label: 'Website', value: 'opa.deonhq.xyz', action: () => handleLinkPress('https://opa.deonhq.xyz') },
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* About Card */}
        <TouchableOpacity
          style={styles.aboutCard}
          onPress={() => handleLinkPress('https://opa.deonhq.xyz')}
          activeOpacity={0.7}
        >
          <View style={styles.aboutCardContent}>
            <Ionicons name="information-circle-outline" size={32} color={COLORS.brand} />
            <View style={styles.aboutCardText}>
              <Text style={styles.aboutCardTitle}>About OpaHost</Text>
              <Text style={styles.aboutCardDescription}>
                Learn more about our mission, values, and comprehensive platform for car rental hosting.
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={COLORS.subtle} />
          </View>
        </TouchableOpacity>

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
              <Ionicons name={contact.icon} size={22} color={COLORS.brand} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{contact.label}</Text>
                <Text style={styles.contactValue}>{contact.value}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={COLORS.subtle} />
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
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    marginBottom: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  aboutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    gap: SPACING.m,
  },
  aboutCardText: {
    flex: 1,
  },
  aboutCardTitle: {
    ...TYPE.section,
    fontSize: 15,
    marginBottom: 4,
    color: COLORS.text,
  },
  aboutCardDescription: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.subtle,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    marginBottom: 12,
    color: COLORS.text,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...TYPE.micro,
    marginBottom: 4,
    color: '#8E8E93',
  },
  contactValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
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
