import React from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import OfflineSvg from '../assets/icons/offline.svg';

export default function OfflineScreen({ onRetry }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <OfflineSvg width={280} height={350} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>
            Please check your internet connection and try again.
          </Text>
        </View>

        {onRetry && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.retryIcon} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.l,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl * 2,
  },
  illustrationContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
    paddingHorizontal: SPACING.l,
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 28,
    marginBottom: SPACING.m,
    textAlign: 'center',
    color: COLORS.text,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: COLORS.subtle,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    minHeight: 56,
    minWidth: 160,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    ...TYPE.section,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
});

