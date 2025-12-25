import React, { useState, useCallback, useLayoutEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  StatusBar, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

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

export default function LegalComplianceScreen({ navigation: nav }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState({
    logbook: null,
    insurance: null,
    inspection: null,
    manual: null,
  });

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
    lightHaptic();
    // TODO: Implement document submission logic
    Alert.alert('Success', 'Documents submitted for verification');
    nav.goBack();
  };

  const isSubmitDisabled = !documents.logbook || !documents.insurance || !documents.inspection;

  const requiredUploadedCount = Number(!!documents.logbook) + Number(!!documents.insurance) + Number(!!documents.inspection);

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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
