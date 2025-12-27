import React, { useState, useCallback, useLayoutEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  StatusBar, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { uploadDocument, uploadMultipleDocuments, getDocumentUrl } from '../services/documentUpload';
import { getUserId } from '../utils/userStorage';

const DocumentUpload = ({ 
  title, 
  onPress, 
  fileName, 
  isRequired = true,
  icon = 'document-text-outline',
  documentType,
  isUploading = false
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
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color={COLORS.brand} />
        ) : fileName ? (
          <Ionicons name="checkmark" size={16} color="#34C759" />
        ) : (
          <Ionicons name="cloud-upload-outline" size={16} color={COLORS.brand} />
        )}
        <Text style={[styles.uploadButtonText, fileName && styles.uploadButtonTextSecondary]}>
          {isUploading ? 'Uploading...' : fileName ? 'Replace' : 'Upload'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function LegalComplianceScreen({ navigation: nav }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState({
    logbook: null,
    insurance: null,
    inspection: null,
    manual: null,
  });
  const [uploadedPaths, setUploadedPaths] = useState({
    logbook: null,
    insurance: null,
    inspection: null,
    manual: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const parent = nav.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [nav])
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

      // Store the file locally first
      const fileData = {
        name: asset.name,
        uri: asset.uri,
        type: asset.mimeType,
      };

      setDocuments(prev => ({
        ...prev,
        [type]: fileData,
      }));

      // Upload to Supabase
      setUploadingType(type);
      setUploading(true);
      lightHaptic();

      // Get user ID from storage (set after login with Python backend)
      const userId = await getUserId();
      
      if (!userId) {
        Alert.alert(
          'Authentication Required',
          'Please log in to upload documents. User ID not found.'
        );
        setUploading(false);
        setUploadingType(null);
        setDocuments(prev => ({
          ...prev,
          [type]: null,
        }));
        return;
      }
      
      const uploadResult = await uploadDocument(fileData, userId, type);

      setUploading(false);
      setUploadingType(null);

      if (uploadResult.success) {
        setUploadedPaths(prev => ({
          ...prev,
          [type]: uploadResult.path,
        }));
        Alert.alert('Success', `${asset.name} uploaded successfully`);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload document');
        // Remove the document from state if upload failed
        setDocuments(prev => ({
          ...prev,
          [type]: null,
        }));
      }
    } catch (err) {
      setUploading(false);
      setUploadingType(null);
      Alert.alert('Error', 'Failed to pick document');
      console.error('Error picking document:', err);
    }
  };

  const handleSubmit = async () => {
    lightHaptic();
    
    // Check if all required documents are uploaded
    const requiredDocs = ['logbook', 'insurance', 'inspection'];
    const missingDocs = requiredDocs.filter(doc => !uploadedPaths[doc]);
    
    if (missingDocs.length > 0) {
      Alert.alert(
        'Missing Documents', 
        'Please upload all required documents before submitting.'
      );
      return;
    }

    setUploading(true);
    
      try {
        // Get user ID for API call
        const userId = await getUserId();
        
        if (!userId) {
          Alert.alert('Authentication Required', 'Please log in to submit documents.');
          return;
        }

        // Prepare document data to send to your Python backend
        const documentData = {
          userId: userId,
          documents: {
            logbook: uploadedPaths.logbook ? {
              path: uploadedPaths.logbook,
              url: getDocumentUrl(uploadedPaths.logbook),
              name: documents.logbook?.name,
            } : null,
            insurance: uploadedPaths.insurance ? {
              path: uploadedPaths.insurance,
              url: getDocumentUrl(uploadedPaths.insurance),
              name: documents.insurance?.name,
            } : null,
            inspection: uploadedPaths.inspection ? {
              path: uploadedPaths.inspection,
              url: getDocumentUrl(uploadedPaths.inspection),
              name: documents.inspection?.name,
            } : null,
            manual: uploadedPaths.manual ? {
              path: uploadedPaths.manual,
              url: getDocumentUrl(uploadedPaths.manual),
              name: documents.manual?.name,
            } : null,
          },
        };
        
        // TODO: Send documentData to your Python backend API
        // Example:
        // const response = await fetch('YOUR_API_URL/api/legal-documents', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${await getUserToken()}`,
        //   },
        //   body: JSON.stringify(documentData),
        // });
        
        console.log('Document data to send to backend:', documentData);
        
        // Simulate API call - Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success', 
        'Documents submitted for verification. You will be notified once verification is complete.',
        [
          {
            text: 'OK',
            onPress: () => nav.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit documents. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setUploading(false);
    }
  };

  const isSubmitDisabled = !documents.logbook || !documents.insurance || !documents.inspection;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            nav.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal Compliance</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>Upload the required documents to verify your vehicle.</Text>

        <DocumentUpload
          title="Vehicle Logbook"
          onPress={() => pickDocument('logbook')}
          fileName={documents.logbook?.name}
          documentType="logbook"
          isUploading={uploading && uploadingType === 'logbook'}
        />

        <DocumentUpload
          title="Valid Insurance Cover"
          onPress={() => pickDocument('insurance')}
          fileName={documents.insurance?.name}
          documentType="insurance"
          isUploading={uploading && uploadingType === 'insurance'}
        />

        <DocumentUpload
          title="Inspection Certificate"
          onPress={() => pickDocument('inspection')}
          fileName={documents.inspection?.name}
          documentType="inspection"
          isUploading={uploading && uploadingType === 'inspection'}
        />

        <DocumentUpload
          title="Car Manual (Optional)"
          onPress={() => pickDocument('manual')}
          fileName={documents.manual?.name}
          isRequired={false}
          icon="book-outline"
          documentType="manual"
          isUploading={uploading && uploadingType === 'manual'}
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
            (isSubmitDisabled || uploading) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={isSubmitDisabled || uploading}
          activeOpacity={0.9}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit for Verification
            </Text>
          )}
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
  content: {
    padding: SPACING.l,
  },
  description: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginBottom: SPACING.l,
    lineHeight: 20,
  },
  uploadContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    marginBottom: SPACING.m,
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
    backgroundColor: COLORS.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  uploadButtonSecondary: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  uploadButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.brand,
  },
  uploadButtonTextSecondary: {
    color: COLORS.text,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    marginTop: SPACING.s,
    marginBottom: SPACING.m,
  },
  noteText: {
    ...TYPE.caption,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.s,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
