import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function MessagesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Notifications');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Your conversations</Text>

        {/* Messages will be loaded from backend */}
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.subtle} />
          <Text style={styles.emptyStateText}>No messages yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Your conversations with guests will appear here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.l,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 20,
    marginBottom: 6,
  },
  subtitle: {
    ...TYPE.body,
    color: '#8E8E93',
    marginBottom: 24,
  },
  threadCard: {
    paddingVertical: SPACING.l,
    paddingLeft: 0,
    paddingRight: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: SPACING.s,
  },
  threadLeft: {
    width: 56,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  threadBody: {
    flex: 1,
  },
  threadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  threadTitle: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  threadTime: {
    ...TYPE.micro,
    color: COLORS.subtle,
  },
  threadPreview: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyStateText: {
    ...TYPE.section,
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
  },
});
