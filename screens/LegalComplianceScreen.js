import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  StatusBar, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

const DocumentUpload = ({ 
  title, 
  description, 
  onPress, 
  fileName, 
  isRequired = true,
  icon = 'document-text-outline'
}) => (
  <View style={styles.uploadContainer}>
    <View style={styles.uploadHeader}>
      <View style={styles.uploadTitleContainer}>
        <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.uploadIcon} />
        <Text style={styles.uploadTitle}>
          {title}
          {isRequired && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      {fileName ? (
        <View style={styles.fileInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={onPress}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      )}
    </View>
    <Text style={styles.uploadDescription}>{description}</Text>
  </View>
);

export default function LegalComplianceScreen({ navigation }) {
  const [documents, setDocuments] = useState({
    logbook: null,
    insurance: null,
    inspection: null,
    manual: null,
  });

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

  const pickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setDocuments(prev => ({
          ...prev,
          [type]: {
            name: result.name,
            uri: result.uri,
            type: result.mimeType,
          }
        }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Error picking document:', err);
    }
  };

  const handleSubmit = () => {
    // TODO: Implement document submission logic
    Alert.alert('Success', 'Documents submitted for verification');
    navigation.goBack();
  };

  const isSubmitDisabled = !documents.logbook || !documents.insurance || !documents.inspection;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Legal Compliance</Text>
        <Text style={styles.description}>
          Please upload the following documents to ensure your vehicle meets all legal requirements.
        </Text>

        <DocumentUpload
          title="Vehicle Logbook"
          description="Official document showing vehicle ownership and registration details"
          onPress={() => pickDocument('logbook')}
          fileName={documents.logbook?.name}
        />

        <DocumentUpload
          title="Valid Insurance Cover"
          description="Current insurance certificate with coverage details"
          onPress={() => pickDocument('insurance')}
          fileName={documents.insurance?.name}
        />

        <DocumentUpload
          title="Inspection Certificate"
          description="Recent vehicle inspection report from an authorized center"
          onPress={() => pickDocument('inspection')}
          fileName={documents.inspection?.name}
        />

        <DocumentUpload
          title="Car Manual (Optional)"
          description="Vehicle manual for reference (PDF or images)"
          onPress={() => pickDocument('manual')}
          fileName={documents.manual?.name}
          isRequired={false}
          icon="book-outline"
        />

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
          <Text style={styles.noteText}>
            Your documents will be securely stored and only used for verification purposes.
            We'll notify you once your documents are approved.
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            isSubmitDisabled && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={0.9}
        >
          <Text style={styles.submitButtonText}>
            Submit for Verification
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.m,
    paddingBottom: SPACING.xl,
  },
  title: {
    ...TYPE.title,
    fontFamily: 'Nunito-Bold',
    marginBottom: SPACING.s,
  },
  description: {
    ...TYPE.body,
    fontFamily: 'Nunito-Regular',
    color: COLORS.muted,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  uploadContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  uploadTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadTitle: {
    ...TYPE.subhead,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  required: {
    color: '#FF3B30',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.m,
    justifyContent: 'flex-end',
  },
  fileName: {
    ...TYPE.footnote,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    marginLeft: 4,
    maxWidth: 150,
  },
  uploadButton: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  uploadButtonText: {
    ...TYPE.subhead,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.primary,
  },
  uploadDescription: {
    ...TYPE.footnote,
    fontFamily: 'Nunito-Regular',
    color: COLORS.muted,
    marginTop: 2,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    marginTop: SPACING.s,
  },
  noteText: {
    ...TYPE.footnote,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...TYPE.headline,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
