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
  onPress, 
  fileName, 
  isRequired = true,
  icon = 'document-text-outline'
}) => (
  <View style={styles.uploadContainer}>
    <View style={styles.uploadHeader}>
      <View style={styles.uploadTitleContainer}>
        <Ionicons name={icon} size={20} color={COLORS.brand} style={styles.uploadIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {title}
            {isRequired && <Text style={styles.required}> *</Text>}
          </Text>
          <Text style={styles.uploadMeta} numberOfLines={1}>
            {fileName ? `Uploaded • ${fileName}` : 'PDF or image'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, fileName && styles.uploadButtonSecondary]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {fileName ? (
          <Ionicons name="checkmark" size={16} color="#34C759" />
        ) : (
          <Ionicons name="cloud-upload-outline" size={16} color={COLORS.brand} />
        )}
        <Text style={[styles.uploadButtonText, fileName && styles.uploadButtonTextSecondary]}>
          {fileName ? 'Replace' : 'Upload'}
        </Text>
      </TouchableOpacity>
    </View>
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

      if (result?.canceled) return;

      const asset = result?.assets?.[0];
      if (!asset) return;

      setDocuments(prev => ({
        ...prev,
        [type]: {
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType,
        }
      }));

      Alert.alert('Uploaded', `${asset.name}`);
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

  const requiredUploadedCount = Number(!!documents.logbook) + Number(!!documents.insurance) + Number(!!documents.inspection);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Legal compliance</Text>
        <Text style={styles.description}>Upload the required documents.</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{requiredUploadedCount}/3 required uploaded</Text>
          {!isSubmitDisabled && (
            <View style={styles.progressBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.progressBadgeText}>Ready</Text>
            </View>
          )}
        </View>

        <DocumentUpload
          title="Vehicle Logbook"
          onPress={() => pickDocument('logbook')}
          fileName={documents.logbook?.name}
        />

        <DocumentUpload
          title="Valid Insurance Cover"
          onPress={() => pickDocument('insurance')}
          fileName={documents.insurance?.name}
        />

        <DocumentUpload
          title="Inspection Certificate"
          onPress={() => pickDocument('inspection')}
          fileName={documents.inspection?.name}
        />

        <DocumentUpload
          title="Car Manual (Optional)"
          onPress={() => pickDocument('manual')}
          fileName={documents.manual?.name}
          isRequired={false}
          icon="book-outline"
        />

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
          <Text style={styles.noteText}>
            Documents are used only for verification.
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
    padding: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  title: {
    ...TYPE.title,
    marginBottom: SPACING.s,
  },
  description: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginBottom: SPACING.m,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.l,
  },
  progressText: {
    ...TYPE.caption,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  progressBadgeText: {
    ...TYPE.caption,
    color: COLORS.text,
  },
  uploadContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  uploadMeta: {
    ...TYPE.caption,
    marginTop: 2,
  },
  required: {
    color: '#FF3B30',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 122, 255, 0.18)',
  },
  uploadButtonSecondary: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.borderStrong,
  },
  uploadButtonText: {
    ...TYPE.caption,
    color: COLORS.brand,
  },
  uploadButtonTextSecondary: {
    color: COLORS.text,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    marginTop: SPACING.s,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  noteText: {
    ...TYPE.caption,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...TYPE.section,
    color: '#FFFFFF',
  },
});
