import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from './tokens';

const ICONS = {
  success: { name: 'checkmark-circle', color: '#34C759' },
  error: { name: 'alert-circle', color: '#FF3B30' },
  info: { name: 'information-circle', color: COLORS.text },
};

export default function StatusModal({
  visible,
  type = 'success',
  title,
  message,
  children,
  primaryLabel = 'OK',
  onPrimary,
  secondaryLabel,
  onSecondary,
  onRequestClose,
}) {
  const icon = ICONS[type] || ICONS.info;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose || onPrimary}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon.name} size={30} color={icon.color} />
          </View>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
          {message ? <Text style={styles.body}>{message}</Text> : null}

          <View style={styles.actions}>
            {secondaryLabel && onSecondary && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onSecondary}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onPrimary}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  title: {
    ...TYPE.title,
    marginBottom: SPACING.xs,
  },
  body: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginBottom: SPACING.l,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.s,
  },
  button: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: RADIUS.button,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
  },
  primaryText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  secondaryText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
  },
});

