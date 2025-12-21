import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function OpaClientDownloadScreen({ navigation }) {
  const handleDownload = () => {
    // TODO: Link to Opa client app store / download URL
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Download Opa Client</Text>
          <Text style={styles.subtitle}>Get the Opa client app for a smoother booking experience.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="download-outline" size={20} color="#111111" />
            <Text style={styles.cardText}>Install the latest Opa client to manage rides faster.</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleDownload}>
            <Text style={styles.primaryButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: 90,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 18,
    gap: 6,
  },
  title: {
    ...TYPE.title,
    fontSize: 20,
    color: '#1C1C1E',
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardText: {
    flex: 1,
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  primaryButton: {
    backgroundColor: '#1D1D1D',
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
});
