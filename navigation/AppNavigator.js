import React from 'react';
import { View, ActivityIndicator, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { lightHaptic } from '../ui/haptics';
import { COLORS } from '../ui/tokens';
import { useHost } from '../utils/HostContext';
import { getOnboardingCompleted } from '../utils/userStorage';

// Main Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import HostScreen from '../screens/HostScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LegalComplianceScreen from '../screens/LegalComplianceScreen';

// Settings and Related Screens
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
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
import NotificationsScreen from '../screens/NotificationsScreen';
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen';
import FinanceScreen from '../screens/FinanceScreen';
import ActiveBookingScreen from '../screens/ActiveBookingScreen';
import PastBookingsScreen from '../screens/PastBookingsScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import WithdrawalTransactionsScreen from '../screens/WithdrawalTransactionsScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import HostLearnMoreScreen from '../screens/HostLearnMoreScreen';
import HostStatsScreen from '../screens/HostStatsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ArdenaClientDownloadScreen from '../screens/ArdenaClientDownloadScreen';
import SupaHostScreen from '../screens/SupaHostScreen';
import BusinessPlanCheckoutScreen from '../screens/BusinessPlanCheckoutScreen';
import BusinessPlanManageScreen from '../screens/BusinessPlanManageScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';
import UploadDocsScreen from '../screens/UploadDocsScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import CarDetailsScreen from '../screens/CarDetailsScreen';
import EditCarScreen from '../screens/EditCarScreen';
import HostVehicleScreen from '../screens/HostVehicleScreen';
import SmartCalendarScreen from '../screens/SmartCalendarScreen';
import PastBookingDetailScreen from '../screens/PastBookingDetailScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import ExtendBookingScreen from '../screens/ExtendBookingScreen';
import ChatScreen from '../screens/ChatScreen';
import CalendarSyncScreen from '../screens/CalendarSyncScreen';
import KycIntroScreen from '../screens/Kyc/KycIntroScreen';
import KycResultScreen from '../screens/Kyc/KycResultScreen';
import MapScreen from '../screens/MapScreen';

const normalizeDeepLink = (url) => {
  if (!url || !url.startsWith('ardenahost://')) {
    return url;
  }

  // Handle links where "reset-password" is interpreted as host:
  // ardenahost://reset-password?token=... -> ardenahost:///reset-password?token=...
  if (url.startsWith('ardenahost://reset-password')) {
    return url.replace('ardenahost://reset-password', 'ardenahost:///reset-password');
  }

  return url;
};

const linking = {
  prefixes: ['ardenahost://', 'ardenahost:///'],
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return normalizeDeepLink(url);
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(normalizeDeepLink(url));
    });

    return () => subscription.remove();
  },
  config: {
    screens: {
      KycResult: 'kyc/result',
      ResetPassword: 'reset-password',
    },
  },
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'My Cars') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: '#999999',
        headerShown: false,
        tabBarBackground: () => (
          <BlurView intensity={45} tint="light" style={{ flex: 1, opacity: 1 }} />
        ),
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Nunito-SemiBold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        listeners={{ tabPress: () => lightHaptic() }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        listeners={{ tabPress: () => lightHaptic() }}
      />
      <Tab.Screen
        name="My Cars"
        component={HostScreen}
        listeners={{ tabPress: () => lightHaptic() }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        listeners={{ tabPress: () => lightHaptic() }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={{ tabPress: () => lightHaptic() }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useHost();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(null);

  // Read onboarding flag once so we can choose initial route (onboarding only once for new users)
  React.useEffect(() => {
    let mounted = true;
    getOnboardingCompleted().then((completed) => {
      if (mounted) setHasCompletedOnboarding(completed);
    });
    return () => { mounted = false; };
  }, []);

  // Show loading until auth check and onboarding flag are ready
  const ready = !isLoading && hasCompletedOnboarding !== null;
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.text} />
      </View>
    );
  }

  const initialRoute =
    isAuthenticated ? 'MainTabs' : (hasCompletedOnboarding ? 'Landing' : 'Onboarding');

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={initialRoute}
      >
        {/* Onboarding + Auth Flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
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

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
        />
        
        {/* Add Payment Method Screen */}
        <Stack.Screen 
          name="AddPaymentMethod" 
          component={AddPaymentMethodScreen}
          options={{
            tabBarStyle: { display: 'none' },
          }}
        />

        {/* Active Booking Screen */}
        <Stack.Screen 
          name="ActiveBooking" 
          component={ActiveBookingScreen}
        />

        <Stack.Screen
          name="ReportIssue"
          component={ReportIssueScreen}
        />

        <Stack.Screen
          name="ExtendBooking"
          component={ExtendBookingScreen}
        />

        {/* Past Bookings Screen */}
        <Stack.Screen 
          name="PastBookings" 
          component={PastBookingsScreen}
        />

        <Stack.Screen
          name="PastBookingDetail"
          component={PastBookingDetailScreen}
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
          name="WithdrawalTransactions"
          component={WithdrawalTransactionsScreen}
        />

        <Stack.Screen 
          name="AllTransactions" 
          component={AllTransactionsScreen}
        />

        <Stack.Screen 
          name="HostLearnMore" 
          component={HostLearnMoreScreen}
        />
        <Stack.Screen 
          name="HostStats" 
          component={HostStatsScreen}
        />

        <Stack.Screen 
          name="LegalCompliance" 
          component={LegalComplianceScreen}
          options={{
            headerShown: true,
            headerTitle: 'Legal Compliance',
            headerBackTitle: 'Back',
            headerTitleStyle: {
              fontFamily: 'Nunito-Bold',
              fontSize: 18,
            },
            headerBackTitleStyle: {
              fontFamily: 'Nunito-Regular',
            },
          }}
        />

        {/* Feedback Screen */}
        <Stack.Screen 
          name="Feedback" 
          component={FeedbackScreen}
        />

        {/* Ardena Client Download Screen */}
        <Stack.Screen 
          name="ArdenaClientDownload" 
          component={ArdenaClientDownloadScreen}
        />

        {/* SupaHost / Ardena for Business */}
        <Stack.Screen 
          name="SupaHost" 
          component={SupaHostScreen}
        />
        <Stack.Screen
          name="BusinessPlanCheckout"
          component={BusinessPlanCheckoutScreen}
        />
        <Stack.Screen
          name="BusinessPlanManage"
          component={BusinessPlanManageScreen}
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

        <Stack.Screen 
          name="SmartCalendar" 
          component={SmartCalendarScreen}
        />

        <Stack.Screen 
          name="CalendarSync" 
          component={CalendarSyncScreen}
        />
        
        {/* Update Profile Screen */}
        <Stack.Screen 
          name="UpdateProfile" 
          component={UpdateProfileScreen}
        />

        {/* KYC onboarding – redirects to Veriff hosted verification */}
        <Stack.Screen name="KycIntro" component={KycIntroScreen} />
        {/* KYC result – opened when user returns from Veriff via ardenahost://kyc/result */}
        <Stack.Screen name="KycResult" component={KycResultScreen} />
        
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
        
        {/* Car Details Screen */}
        <Stack.Screen 
          name="CarDetails" 
          component={CarDetailsScreen}
        />

        <Stack.Screen 
          name="EditCar" 
          component={EditCarScreen}
        />
        
        {/* Host Vehicle Screen */}
        <Stack.Screen 
          name="HostVehicle" 
          component={HostVehicleScreen}
        />
        
        {/* Settings and Related Screens */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
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
