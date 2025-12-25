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

        <TouchableOpacity
          style={styles.threadCard}
          activeOpacity={0.9}
          onPress={() => {
            lightHaptic();
            navigation.navigate('Chat', { title: 'Brian' });
          }}
        >
          <View style={styles.threadLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={COLORS.subtle} />
            </View>
          </View>

          <View style={styles.threadBody}>
            <View style={styles.threadTop}>
              <Text style={styles.threadTitle} numberOfLines={1}>
                Brian
              </Text>
              <Text style={styles.threadTime}>2:17 PM</Text>
            </View>
            <Text style={styles.threadPreview} numberOfLines={1}>
              Perfect. I'll share the exact spot once I arrive.
            </Text>
          </View>
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
});
