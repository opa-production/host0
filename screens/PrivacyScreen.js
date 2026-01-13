import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const PrivacyScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const timeoutRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDownloadData = () => {
    setShowDownloadModal(true);
  };

  const handleConfirmDownload = () => {
    setShowDownloadModal(false);
    // TODO: Implement data download
    timeoutRef.current = setTimeout(() => {
      setShowSuccessModal(true);
      timeoutRef.current = null;
    }, 300);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

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
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownloadData}
            activeOpacity={1}
          >
            <View style={styles.actionButtonLeft}>
              <Ionicons name="download-outline" size={22} color="#007AFF" />
              <Text style={styles.actionButtonText}>Download My Data</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Privacy Policy</Text>
          <Text style={styles.infoText}>
            We are committed to protecting your privacy. Your personal information is securely stored and only used to provide you with the best service experience.
          </Text>
        </View>

        {/* Download Confirmation Modal */}
        <Modal
          visible={showDownloadModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDownloadModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="download-outline" size={40} color="#007AFF" />
              </View>
              <Text style={styles.modalTitle}>Download My Data</Text>
              <Text style={styles.modalMessage}>
                Your data will be prepared and sent to your registered email address. This may take a few minutes.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowDownloadModal(false)}
                  activeOpacity={1}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleConfirmDownload}
                  activeOpacity={1}
                >
                  <Text style={styles.modalButtonTextPrimary}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseSuccessModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseSuccessModal}
                activeOpacity={1}
              >
                <Ionicons name="close" size={24} color="#999999" />
              </TouchableOpacity>
              
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
              <Text style={styles.modalTitle}>Request Submitted</Text>
              <Text style={styles.modalMessage}>
                Your data download request has been submitted. You will receive an email shortly.
              </Text>
              <TouchableOpacity
                style={[styles.modalButtonSingle, styles.modalButtonPrimary]}
                onPress={handleCloseSuccessModal}
                activeOpacity={1}
              >
                <Text style={styles.modalButtonTextPrimary}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  actionButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  infoSection: {
    paddingHorizontal: 4,
  },
  infoTitle: {
    ...TYPE.section,
    fontSize: 15,
    marginBottom: 12,
    color: '#1C1C1E',
  },
  infoText: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#007AFF15',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#4CAF5015',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#000000',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    color: '#666666',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSingle: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f0f0f0',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#666666',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
});

export default PrivacyScreen;
