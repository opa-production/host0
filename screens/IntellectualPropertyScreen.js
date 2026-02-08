import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const IntellectualPropertyScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const sections = [
    {
      title: 'Ownership of Content',
      content: 'All content on the Ardena Host platform, including logos, designs, text, graphics, images, software, code, and user interfaces, is the exclusive property of Ardena Host and is protected by copyright, trademark, and other intellectual property laws.',
    },
    {
      title: 'Trademarks',
      content: 'The Ardena Host name, logo, and all related marks, graphics, and designs are trademarks of Ardena Host. These trademarks may not be used without our prior written permission.',
    },
    {
      title: 'User-Generated Content',
      content: 'When you upload content to our platform, you grant Ardena Host a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content for the purpose of operating and promoting the platform.',
    },
    {
      title: 'Prohibited Uses',
      content: 'Users may not copy, reproduce, distribute, modify, create derivative works, publicly display, or use any of our intellectual property without explicit written permission.',
    },
    {
      title: 'Third-Party Content',
      content: 'Our platform may contain content from third parties. Respect for third-party intellectual property rights is required. Users are responsible for ensuring they have rights to any content they submit.',
    },
    {
      title: 'Copyright Protection',
      content: 'All original content on the Ardena Host platform is protected by copyright law. If you believe your copyright has been infringed, please contact us with details.',
    },
    {
      title: 'License to Use Platform',
      content: 'Ardena Host grants users a limited, non-exclusive, non-transferable license to access and use the platform for its intended purposes.',
    },
    {
      title: 'Enforcement',
      content: 'Ardena Host takes intellectual property rights seriously. Violations of these terms may result in immediate account termination, removal of infringing content, and potential legal action.',
    },
    {
      title: 'Reporting Infringement',
      content: 'If you believe your intellectual property rights have been violated on our platform, please contact us at legal@ardena.xyz with detailed information.',
    },
    {
      title: 'Reservation of Rights',
      content: 'All rights not expressly granted in these terms are reserved by Ardena Host. Nothing in these terms should be construed as granting any license or right to use any intellectual property without our explicit written permission.',
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
        <Text style={styles.mainTitle}>Intellectual Property</Text>
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

export default IntellectualPropertyScreen;
