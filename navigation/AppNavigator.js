import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Main Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import HostScreen from '../screens/HostScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Settings and Related Screens
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CustomerSupportScreen from '../screens/CustomerSupportScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import LanguageScreen from '../screens/LanguageScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import LegalScreen from '../screens/LegalScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import UserAgreementScreen from '../screens/UserAgreementScreen';
import LiabilityInsuranceScreen from '../screens/LiabilityInsuranceScreen';
import IntellectualPropertyScreen from '../screens/IntellectualPropertyScreen';
import MapScreen from '../screens/MapScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen';
import FinanceScreen from '../screens/FinanceScreen';
import ActiveBookingScreen from '../screens/ActiveBookingScreen';
import PastBookingsScreen from '../screens/PastBookingsScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import TrackCarSelectScreen from '../screens/TrackCarSelectScreen';
import HostLearnMoreScreen from '../screens/HostLearnMoreScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import OpaClientDownloadScreen from '../screens/OpaClientDownloadScreen';
import SupaHostScreen from '../screens/SupaHostScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';
import UploadDocsScreen from '../screens/UploadDocsScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import HostVehicleScreen from '../screens/HostVehicleScreen';
import CarGalleryScreen from '../screens/CarGalleryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Host') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1D1D1D',
        tabBarInactiveTintColor: '#999999',
        headerShown: false,
        tabBarBackground: () => (
          <BlurView intensity={45} tint="light" style={{ flex: 1, opacity: 1 }} />
        ),
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 68,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Nunito-SemiBold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Host" component={HostScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        
        {/* Main App */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Map Screen */}
        <Stack.Screen name="Map" component={MapScreen} />
        
        {/* Notifications Screen */}
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{
            tabBarStyle: { display: 'none' },
          }}
        />
        
        {/* Add Payment Method Screen */}
        <Stack.Screen 
          name="AddPaymentMethod" 
          component={AddPaymentMethodScreen}
        />

        {/* Active Booking Screen */}
        <Stack.Screen 
          name="ActiveBooking" 
          component={ActiveBookingScreen}
        />

        {/* Past Bookings Screen */}
        <Stack.Screen 
          name="PastBookings" 
          component={PastBookingsScreen}
        />
        
        {/* Finance Screen */}
        <Stack.Screen 
          name="Finance" 
          component={FinanceScreen}
        />

        <Stack.Screen 
          name="Withdraw" 
          component={WithdrawScreen}
        />

        <Stack.Screen 
          name="AllTransactions" 
          component={AllTransactionsScreen}
        />

        <Stack.Screen 
          name="TrackCarSelect" 
          component={TrackCarSelectScreen}
        />

        <Stack.Screen 
          name="HostLearnMore" 
          component={HostLearnMoreScreen}
        />

        {/* Feedback Screen */}
        <Stack.Screen 
          name="Feedback" 
          component={FeedbackScreen}
        />

        {/* Opa Client Download Screen */}
        <Stack.Screen 
          name="OpaClientDownload" 
          component={OpaClientDownloadScreen}
        />

        {/* SupaHost Screen */}
        <Stack.Screen 
          name="SupaHost" 
          component={SupaHostScreen}
        />
        <Stack.Screen
          name="GetBadge"
          component={require('../screens/GetBadgeScreen').default}
        />
        
        {/* Reset Password Screen */}
        <Stack.Screen 
          name="ResetPassword" 
          component={ResetPasswordScreen}
        />
        
        {/* Update Profile Screen */}
        <Stack.Screen 
          name="UpdateProfile" 
          component={UpdateProfileScreen}
        />
        
        {/* Upload Docs Screen */}
        <Stack.Screen 
          name="UploadDocs" 
          component={UploadDocsScreen}
        />
        
        {/* My Listings Screen */}
        <Stack.Screen 
          name="MyListings" 
          component={MyListingsScreen}
        />
        
        {/* Host Vehicle Screen */}
        <Stack.Screen 
          name="HostVehicle" 
          component={HostVehicleScreen}
        />
        
        {/* Car Gallery Screen */}
        <Stack.Screen 
          name="CarGallery" 
          component={CarGalleryScreen}
        />
        
        {/* Settings and Related Screens */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} />
        <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="UserAgreement" component={UserAgreementScreen} />
        <Stack.Screen name="LiabilityInsurance" component={LiabilityInsuranceScreen} />
        <Stack.Screen name="IntellectualProperty" component={IntellectualPropertyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
