import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const NotificationPreferencesScreen = () => {
  const navigation = useNavigation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
          <Text style={styles.headerTitle}>Notification Preferences</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications via email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#e0e0e0', true: '#FF1577' }}
              thumbColor={emailNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>SMS Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications via SMS</Text>
            </View>
            <Switch
              value={smsNotifications}
              onValueChange={setSmsNotifications}
              trackColor={{ false: '#e0e0e0', true: '#FF1577' }}
              thumbColor={smsNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>In-App Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications within the app</Text>
            </View>
            <Switch
              value={inAppNotifications}
              onValueChange={setInAppNotifications}
              trackColor={{ false: '#e0e0e0', true: '#FF1577' }}
              thumbColor={inAppNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Marketing Notifications</Text>
              <Text style={styles.settingDescription}>Receive promotional and marketing updates</Text>
            </View>
            <Switch
              value={marketingNotifications}
              onValueChange={setMarketingNotifications}
              trackColor={{ false: '#e0e0e0', true: '#FF1577' }}
              thumbColor={marketingNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
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
    padding: 16,
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  section: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 4,
    color: '#000000',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    lineHeight: 20,
    color: '#666666',
  },
});

export default NotificationPreferencesScreen;
