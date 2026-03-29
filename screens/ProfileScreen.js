import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { uploadHostProfilePicture } from '../services/mediaService';
import { useHost } from '../utils/HostContext';
import { logoutHost } from '../services/authService';
import { getKycStatus } from '../services/kycService';
import { getHostSubscription } from '../services/subscriptionService';
import { getHidePremiumBadgePreference } from '../utils/userStorage';
import StatusModal from '../ui/StatusModal';

export default function ProfileScreen({ navigation }) {
  const { host, logout, refreshProfile, updateHost } = useHost();
  const insets = useSafeAreaInsets();
  const [kycStatus, setKycStatus] = useState(null);
  /** Paid Starter / Premium label for subtitle (days shown separately in orange). */
  const [businessPlanLabel, setBusinessPlanLabel] = useState(null);
  /** e.g. "30d left" — rendered in orange next to label */
  const [businessPlanDaysText, setBusinessPlanDaysText] = useState(null);
  const [showPremiumBadge, setShowPremiumBadge] = useState(false);
  const [uploadFeedbackModal, setUploadFeedbackModal] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const lastProfileRefreshRef = useRef(0);
  const PROFILE_REFRESH_THROTTLE_MS = 60 * 1000; // 1 minute

  // Skeleton component for loading state with shimmer effect
  const SkeletonBox = ({ width, height, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            backgroundColor: '#E5E5EA',
            borderRadius: 8,
            opacity,
          },
          style,
        ]}
      />
    );
  };

  // Debug: Log avatar_url changes
  React.useEffect(() => {
    console.log('📸 [ProfileScreen] host.avatar_url changed:', host?.avatar_url);
  }, [host?.avatar_url]);

  // Refresh profile and KYC in background on focus, throttled so /host/me isn't called continuously
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const now = Date.now();
      const shouldRefreshProfile = now - lastProfileRefreshRef.current >= PROFILE_REFRESH_THROTTLE_MS;

      const loadInBackground = async () => {
        const promises = [getKycStatus()];
        if (shouldRefreshProfile) {
          lastProfileRefreshRef.current = now;
          promises.unshift(refreshProfile());
        }
        const results = await Promise.all(promises);
        if (!isMounted) return;
        const kycResult = shouldRefreshProfile ? results[1] : results[0];
        if (kycResult?.success && kycResult?.status != null) {
          setKycStatus(kycResult.status);
        } else {
          setKycStatus(null);
        }

        const subRes = await getHostSubscription();
        const hideBadgePref = await getHidePremiumBadgePreference();
        if (!isMounted) return;
        if (subRes.success && subRes.subscription) {
          const s = subRes.subscription;
          const plan = (s.plan || 'free').toString().toLowerCase();
          const paid = s.is_paid_active === true;
          setShowPremiumBadge(paid && plan === 'premium' && !hideBadgePref);
          if (paid && (plan === 'starter' || plan === 'premium')) {
            const label = plan === 'premium' ? 'Premium' : 'Starter';
            setBusinessPlanLabel(label);
            if (s.days_remaining != null && s.days_remaining !== '') {
              setBusinessPlanDaysText(`${s.days_remaining}d left`);
            } else {
              setBusinessPlanDaysText(null);
            }
          } else {
            setBusinessPlanLabel(null);
            setBusinessPlanDaysText(null);
          }
        } else {
          setBusinessPlanLabel(null);
          setBusinessPlanDaysText(null);
          setShowPremiumBadge(false);
        }
      };
      loadInBackground();
      return () => { isMounted = false; };
    }, [refreshProfile])
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setUploadFeedbackModal({
        visible: true,
        type: 'info',
        title: 'Photos access',
        message: 'Allow photo access in Settings to update your profile picture.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      
      try {
        if (!host?.id) {
          setUploadFeedbackModal({
            visible: true,
            type: 'error',
            title: 'Something went wrong',
            message: 'Unable to upload. Please sign in again and try once more.',
          });
          return;
        }

        const file = {
          uri: uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        };

        const uploadResult = await uploadHostProfilePicture(file, host.id.toString());
        if (uploadResult.success && uploadResult.url) {
          console.log('📸 [ProfileScreen] Upload successful, URL:', uploadResult.url);
          // Update local context immediately with new avatar URL
          await updateHost({ avatar_url: uploadResult.url });
          console.log('📸 [ProfileScreen] Updated host context with avatar_url:', uploadResult.url);
          setUploadFeedbackModal({
            visible: true,
            type: 'success',
            title: 'Photo updated',
            message: 'Your profile picture was updated.',
          });
        } else {
          setUploadFeedbackModal({
            visible: true,
            type: 'error',
            title: 'Upload failed',
            message: uploadResult.error || 'Could not upload your profile picture. Try again.',
          });
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        setUploadFeedbackModal({
          visible: true,
          type: 'error',
          title: 'Upload failed',
          message: 'Something went wrong. Please try again.',
        });
      }
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    lightHaptic();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      // Call backend logout and clear storage
      await logoutHost();
      // Clear context
      await logout();
      // Navigate to landing
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if backend call fails
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('UpdateProfile', { hostData: host });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Floating Settings Button */}

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card with Image and Details */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {host?.avatar_url ? (
              <Image 
                source={{ uri: host.avatar_url }} 
                style={styles.profileImage}
                key={host.avatar_url}
                onError={(error) => {
                  console.log('📸 [ProfileScreen] Image load error:', error);
                  console.log('📸 [ProfileScreen] Avatar URL:', host.avatar_url);
                }}
                onLoad={() => {
                  console.log('📸 [ProfileScreen] Image loaded successfully:', host.avatar_url);
                }}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={46} color="#999999" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={() => { lightHaptic(); pickImage(); }} activeOpacity={0.85}>
              <Ionicons name="camera" size={18} color="#111111" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileDetails}>
            {!host ? (
              <>
                <SkeletonBox width={150} height={20} style={{ marginBottom: 8, borderRadius: 6 }} />
                <SkeletonBox width={200} height={14} style={{ borderRadius: 6 }} />
              </>
            ) : (
              <>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileName}>{host.full_name || 'Host User'}</Text>
                  {showPremiumBadge ? (
                    <Image
                      source={require('../assets/images/badge.png')}
                      style={styles.profilePremiumBadge}
                      resizeMode="contain"
                      accessibilityLabel="Premium host"
                    />
                  ) : null}
                </View>
                <Text style={styles.profileEmail}>{host.email || ''}</Text>
              </>
            )}
          </View>
        </View>

        {/* Separator Line */}
        <View style={styles.profileSeparator} />

        {/* Account Information Link */}
        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => {
              lightHaptic();
              handleEditProfile();
            }}
          >
            <Ionicons name="person-outline" size={22} color="#666666" style={styles.linkIcon} />
            <Text style={styles.linkText}>Account Information</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => {
              lightHaptic();
              const statusLower = (kycStatus?.status || '').toLowerCase();
              const isVerified = statusLower === 'approved' || statusLower === 'verified';
              navigation.navigate(isVerified ? 'KycResult' : 'KycIntro');
            }}
          >
            <Ionicons name="scan-outline" size={22} color="#666666" style={styles.linkIcon} />
            <Text style={styles.linkText}>ID verification</Text>
            {(kycStatus?.status || '').toLowerCase() === 'approved' || (kycStatus?.status || '').toLowerCase() === 'verified' ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* All Links Section */}
        <View style={[styles.section, styles.sectionAboveLogout]}>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>More</Text>
          
          <View style={styles.linkGroup}>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('Settings'); }}
            >
              <Ionicons name="settings-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Settings</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('AddPaymentMethod'); }}
            >
              <Ionicons name="card-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Add Payment Method</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => {
                lightHaptic();
                if (businessPlanLabel) {
                  navigation.navigate('BusinessPlanManage');
                } else {
                  navigation.navigate('SupaHost');
                }
              }}
            >
              <Ionicons name="business-outline" size={22} color="#666666" style={styles.linkIcon} />
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkTextInner}>Ardena for Business</Text>
                {businessPlanLabel ? (
                  <Text style={styles.linkSubText}>
                    <Text style={styles.linkSubTextPlan}>{businessPlanLabel}</Text>
                    {businessPlanDaysText ? (
                      <>
                        <Text style={styles.linkSubTextPlan}>{' · '}</Text>
                        <Text style={styles.linkSubTextCountdown}>{businessPlanDaysText}</Text>
                      </>
                    ) : null}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('Feedback'); }}
            >
              <Ionicons name="chatbox-ellipses-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Share Feedback</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>


          </View>
        </View>

        <View style={[styles.section, styles.logoutSection]}>
          <View style={styles.logoutSectionDivider} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {showLogoutConfirm && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalBody}>You’ll need to sign in again to access your account.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleConfirmLogout}>
                <Text style={styles.modalConfirmText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <StatusModal
        visible={uploadFeedbackModal.visible}
        type={uploadFeedbackModal.type}
        title={uploadFeedbackModal.title}
        message={uploadFeedbackModal.message}
        primaryLabel="OK"
        onPrimary={() => setUploadFeedbackModal((s) => ({ ...s, visible: false }))}
        onRequestClose={() => setUploadFeedbackModal((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  settingsButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.l,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileDetails: {
    alignItems: 'center',
  },
  profileImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  profileImagePlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    maxWidth: '100%',
  },
  profileName: {
    ...TYPE.title,
    fontSize: 17,
    color: '#1C1C1E',
    textAlign: 'center',
    flexShrink: 1,
  },
  profilePremiumBadge: {
    width: 26,
    height: 26,
  },
  profileEmail: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  section: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
  },
  /** Tighter gap before logout row */
  sectionAboveLogout: {
    marginBottom: SPACING.xs,
  },
  logoutSection: {
    marginTop: 0,
    marginBottom: SPACING.m,
  },
  logoutSectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginBottom: SPACING.xs,
  },
  linkGroup: {
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkIcon: {
    marginRight: 16,
  },
  linkText: {
    flex: 1,
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  linkTextBlock: {
    flex: 1,
    marginRight: 8,
  },
  linkTextInner: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  linkSubText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    marginTop: 2,
  },
  linkSubTextPlan: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
  },
  linkSubTextCountdown: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: COLORS.countdownOrange,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#34C759',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginBottom: SPACING.s,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutIcon: {
    marginRight: 16,
  },
  logoutText: {
    flex: 1,
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF3B30',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  modalTitle: {
    ...TYPE.title,
    marginBottom: SPACING.s,
  },
  modalBody: {
    ...TYPE.body,
    color: COLORS.muted,
    marginBottom: SPACING.l,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.s,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.button,
  },
  modalCancel: {
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    ...TYPE.subhead,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  modalConfirmText: {
    ...TYPE.subhead,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  modalConfirm: {
    backgroundColor: '#007AFF',
  },
});
