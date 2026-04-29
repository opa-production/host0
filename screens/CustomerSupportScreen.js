import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { sendSupportMessage, getSupportConversation } from '../services/supportService';
import AppLoader from "../ui/AppLoader";

// Support phone number
const SUPPORT_PHONE = '0702248984';

export default function CustomerSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
    });
    return () => sub.remove();
  }, []);

  const loadConversation = async () => {
    setIsLoading(true);
    try {
      const result = await getSupportConversation();
      if (result.success) {
        setMessages(result.messages || []);
        // Scroll to bottom after loading
        setTimeout(() => {
          listRef.current?.scrollToEnd?.({ animated: false });
        }, 100);
      } else {
        console.error('Failed to load conversation:', result.error);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, []);

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [])
  );

  const handleCallAgent = () => {
    lightHaptic();
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call. Please check your device settings.');
    });
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) return;

    if (text.length > 2000) {
      Alert.alert('Message too long', 'Message must be 2000 characters or less.');
      return;
    }

    lightHaptic();
    setIsSending(true);

    // Optimistically add message to UI
    const now = new Date();
    const tempMessage = {
      id: `temp-${Date.now()}`,
      fromMe: true,
      text,
      ts: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      createdAt: now.toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    const previousDraft = draft;
    setDraft('');

    // Scroll to bottom
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });

    try {
      const result = await sendSupportMessage(previousDraft);
      
      if (result.success) {
        // Reload conversation to get the actual message from server
        await loadConversation();
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
        setDraft(previousDraft);
        Alert.alert(
          'Failed to send message',
          result.error || 'Unable to send message. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
      setDraft(previousDraft);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
    }
  };

  const parseUTC = (raw) => {
    const s = String(raw);
    const hasTimezone = s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s);
    return new Date(hasTimezone ? s : s + 'Z');
  };

  const localTime = (d) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const formatMessageTime = (item) => {
    if (item.createdAt) {
      try {
        const date = parseUTC(item.createdAt);
        if (!isNaN(date.getTime())) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

          if (messageDate.getTime() === today.getTime()) {
            const diffMs = now.getTime() - date.getTime();
            if (diffMs < 60000) return 'Just now';
            return localTime(date);
          }

          const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
          if (diffDays === 1) return 'Yesterday';
          if (diffDays < 7) return `${diffDays}d ago`;

          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      } catch (e) {
        // fall through
      }
    }
    return item.ts || 'Just now';
  };

  const renderItem = ({ item }) => {
    const bubbleStyle = item.fromMe ? styles.bubbleMe : styles.bubbleThem;
    const textStyle = item.fromMe ? styles.bubbleTextMe : styles.bubbleTextThem;

    return (
      <View style={[styles.row, item.fromMe ? styles.rowMe : styles.rowThem]}>
        <View style={[styles.bubble, bubbleStyle]}>
          <Text style={[styles.bubbleText, textStyle]}>{item.text}</Text>
          <Text style={styles.time}>{formatMessageTime(item)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerCenterContent}>
            <Image 
              source={require('../assets/icons/49036.jpg')} 
              style={styles.headerAvatar}
              resizeMode="cover"
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Customer Support
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {isTyping ? 'Agent is typing...' : 'We typically reply within a few minutes'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerIcon}
          onPress={handleCallAgent}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <AppLoader size="large" color={COLORS.text} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color={COLORS.subtle} />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptySubtitle}>
                  Send us a message and we'll get back to you as soon as possible.
                </Text>
              </View>
            }
          />
        )}

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, SPACING.s) }]}>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.subtle}
              multiline
              maxHeight={110}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (Platform.OS === 'ios') return; // multiline submit conflicts on iOS
                send();
              }}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={send}
              activeOpacity={0.85}
              disabled={!draft.trim() || isSending}
            >
              {isSending ? (
                <AppLoader size="small" color="#ffffff" />
              ) : (
                <Ionicons name="arrow-up" size={18} color={'#ffffff'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderStrong,
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerCenterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...TYPE.section,
    fontSize: 16,
  },
  headerSub: {
    ...TYPE.micro,
    color: COLORS.subtle,
    marginTop: 2,
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...TYPE.section,
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    marginTop: 12,
  },
  row: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowThem: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleMe: {
    backgroundColor: COLORS.text,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bubbleThem: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
  },
  bubbleText: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#ffffff',
  },
  bubbleTextThem: {
    color: COLORS.text,
  },
  time: {
    ...TYPE.micro,
    marginTop: 6,
    color: COLORS.subtle,
    opacity: 0.85,
    fontSize: 11,
  },
  composerWrap: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderStrong,
    backgroundColor: COLORS.bg,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    lineHeight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 36,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
