import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CustomerSupportScreen = () => {
  const navigation = useNavigation();
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
          activeOpacity={0.7}
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
          activeOpacity={0.7}
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
              activeOpacity={0.7}
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
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
      <TouchableOpacity 
        style={styles.floatingBackButton}
        onPress={() => {
          if (showTicketForm) {
            setShowTicketForm(false);
          } else {
            navigation.goBack();
          }
        }}
      >
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#000000" />
        </View>
      </TouchableOpacity>

      {!showTicketForm ? renderInitialOptions() : renderTicketForm()}

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
  initialOptionsContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
    justifyContent: 'center',
  },
  optionsHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  optionsTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000000',
  },
  optionsSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 22,
    color: '#666666',
  },
  optionsButtons: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  optionButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionButtonTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 4,
    color: '#000000',
  },
  optionButtonDesc: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingTop: 100,
    paddingBottom: 40,
  },
  formSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  formSectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
    color: '#000000',
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 8,
    color: '#000000',
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    backgroundColor: '#f8f8f8',
    color: '#000000',
  },
  formTextArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    backgroundColor: '#f8f8f8',
    color: '#000000',
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
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  urgencyButtonActive: {
    borderWidth: 0,
  },
  urgencyButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formButtonCancel: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formButtonSubmit: {
    backgroundColor: '#FF1577',
  },
  formButtonTextCancel: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#666666',
  },
  formButtonTextSubmit: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#000000',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    color: '#666666',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#FF1577',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
});

export default CustomerSupportScreen;
