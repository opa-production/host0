import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const CustomerSupportScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showTicketForm, setShowTicketForm] = useState(false);
  
  // Create Ticket state
  const [ticketUrgency, setTicketUrgency] = useState('medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [showTicketSuccessModal, setShowTicketSuccessModal] = useState(false);

  // Support phone number
  const SUPPORT_PHONE = '0702248984';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleCallAgent = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`);
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim()) {
      Alert.alert('Required Field', 'Please enter a subject for your ticket.');
      return;
    }
    if (!ticketDescription.trim()) {
      Alert.alert('Required Field', 'Please enter a description for your ticket.');
      return;
    }

    // TODO: Submit ticket to backend
    console.log('Ticket submitted:', {
      urgency: ticketUrgency,
      subject: ticketSubject,
      description: ticketDescription,
    });

    setShowTicketSuccessModal(true);
    // Reset form
    setTicketSubject('');
    setTicketDescription('');
    setTicketUrgency('medium');
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FFA500';
      case 'high':
        return '#F44336';
      default:
        return '#999999';
    }
  };

  const renderInitialOptions = () => (
    <View style={styles.initialOptionsContainer}>
      <View style={styles.optionsHeader}>
        <Text style={styles.optionsTitle}>How can we help you?</Text>
        <Text style={styles.optionsSubtitle}>Choose an option to get started</Text>
      </View>

      <View style={styles.optionsButtons}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setShowTicketForm(true)}
          activeOpacity={1}
        >
          <Ionicons name="document-text-outline" size={24} color="#666666" />
          <View style={styles.optionButtonContent}>
            <Text style={styles.optionButtonTitle}>Create Ticket</Text>
            <Text style={styles.optionButtonDesc}>Submit a support ticket</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleCallAgent}
          activeOpacity={1}
        >
          <Ionicons name="call-outline" size={24} color="#666666" />
          <View style={styles.optionButtonContent}>
            <Text style={styles.optionButtonTitle}>Call Our Agent</Text>
            <Text style={styles.optionButtonDesc}>Speak with our support team</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTicketForm = () => (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            setShowTicketForm(false);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ticket</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Urgency Level</Text>
        <View style={styles.urgencyButtonsContainer}>
          {['low', 'medium', 'high'].map((urgency) => (
            <TouchableOpacity
              key={urgency}
              style={[
                styles.urgencyButton,
                ticketUrgency === urgency && [
                  styles.urgencyButtonActive,
                  { backgroundColor: getUrgencyColor(urgency) },
                ],
                {
                  borderColor:
                    ticketUrgency === urgency
                      ? getUrgencyColor(urgency)
                      : '#e0e0e0',
                },
              ]}
              onPress={() => setTicketUrgency(urgency)}
              activeOpacity={1}
            >
              <Text
                style={[
                  styles.urgencyButtonText,
                  {
                    color:
                      ticketUrgency === urgency
                        ? '#ffffff'
                        : '#666666',
                  },
                ]}
              >
                {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>
          Subject <Text style={{ color: '#F44336' }}>*</Text>
        </Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter ticket subject"
          placeholderTextColor="#999999"
          value={ticketSubject}
          onChangeText={setTicketSubject}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>
          Description <Text style={{ color: '#F44336' }}>*</Text>
        </Text>
        <TextInput
          style={styles.formTextArea}
          placeholder="Describe your issue or request..."
          placeholderTextColor="#999999"
          value={ticketDescription}
          onChangeText={setTicketDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.formButton, styles.formButtonCancel]}
          onPress={() => setShowTicketForm(false)}
        >
          <Text style={styles.formButtonTextCancel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formButton, styles.formButtonSubmit]}
          onPress={handleSubmitTicket}
        >
          <Text style={styles.formButtonTextSubmit}>Submit Ticket</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {!showTicketForm ? (
        <>
          {/* Floating Back Button for initial view */}
          <TouchableOpacity 
            style={styles.floatingBackButton}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={20} color="#000000" />
            </View>
          </TouchableOpacity>
          {renderInitialOptions()}
        </>
      ) : (
        renderTicketForm()
      )}

      {/* Ticket Success Modal */}
      <Modal
        visible={showTicketSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTicketSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Ticket Created!</Text>
            <Text style={styles.modalMessage}>
              Your support ticket has been submitted successfully. We'll get back to you soon.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowTicketSuccessModal(false);
                setShowTicketForm(false);
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  initialOptionsContainer: {
    flex: 1,
    padding: SPACING.l,
    paddingTop: 100,
    justifyContent: 'center',
  },
  optionsHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  optionsTitle: {
    ...TYPE.title,
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  optionsSubtitle: {
    ...TYPE.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    color: '#8E8E93',
  },
  optionsButtons: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  optionButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionButtonTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    marginBottom: 4,
    color: '#1C1C1E',
  },
  optionButtonDesc: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: 100,
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
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  formSection: {
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  formSectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    marginBottom: 12,
    color: '#1C1C1E',
  },
  formLabel: {
    ...TYPE.micro,
    marginBottom: 8,
    color: '#8E8E93',
  },
  formInput: {
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    color: '#1C1C1E',
  },
  formTextArea: {
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    color: '#1C1C1E',
    minHeight: 120,
  },
  urgencyButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  urgencyButtonActive: {
    borderWidth: 0,
  },
  urgencyButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formButtonCancel: {
    backgroundColor: '#F2F2F7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  formButtonSubmit: {
    backgroundColor: '#000000',
  },
  formButtonTextCancel: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#1C1C1E',
  },
  formButtonTextSubmit: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
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
    padding: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#4CAF5020',
  },
  modalTitle: {
    ...TYPE.title,
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  modalMessage: {
    ...TYPE.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    color: '#8E8E93',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default CustomerSupportScreen;
