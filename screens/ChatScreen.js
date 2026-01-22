import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getClientConversation, sendMessageToClient } from '../services/messageService';

export default function ChatScreen({ navigation, route }) {
  const clientId = route?.params?.clientId;
  const clientName = route?.params?.clientName || 'Client';
  const conversationId = route?.params?.conversationId;
  const title = route?.params?.title || clientName;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef(null);

  const formatTime = (createdAt) => {
    if (!createdAt) return 'Now';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return 'Now';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return 'Now';
    }
  };

  const loadConversation = async () => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getClientConversation(clientId);
      if (result.success && result.conversation) {
        // Map API messages to UI format
        const mappedMessages = (result.conversation.messages || []).map((msg) => ({
          id: msg.id.toString(),
          fromMe: msg.sender_type === 'host',
          text: msg.message,
          ts: formatTime(msg.created_at),
          createdAt: msg.created_at,
          isRead: msg.is_read,
        }));
        
        setMessages(mappedMessages);
      } else {
        setMessages([]);
        if (result.error) {
          console.error('Error loading conversation:', result.error);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    loadConversation();
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        loadConversation();
      }
    }, [clientId])
  );

  const send = async () => {
    const text = draft.trim();
    if (!text || !clientId) return;

    lightHaptic();
    setIsSending(true);

    // Optimistically add message to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      fromMe: true,
      text,
      ts: 'Sending...',
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setDraft('');

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });

    try {
      const result = await sendMessageToClient(clientId, text);
      if (result.success && result.message) {
        // Replace temp message with real one from API
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== tempMessage.id);
          return [...filtered, {
            id: result.message.id.toString(),
            fromMe: true,
            text: result.message.message,
            ts: formatTime(result.message.created_at),
            createdAt: result.message.created_at,
            isRead: result.message.is_read,
          }];
        });

        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd?.({ animated: true });
        });
      } else {
        // Remove temp message on error
        setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
        Alert.alert('Error', result.error || 'Failed to send message');
        setDraft(text); // Restore draft
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setDraft(text); // Restore draft
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const bubbleStyle = item.fromMe ? styles.bubbleMe : styles.bubbleThem;
    const textStyle = item.fromMe ? styles.bubbleTextMe : styles.bubbleTextThem;

    return (
      <View style={[styles.row, item.fromMe ? styles.rowMe : styles.rowThem]}>
        <View style={[styles.bubble, bubbleStyle]}>
          <Text style={[styles.bubbleText, textStyle]}>{item.text}</Text>
          <Text style={styles.time}>{item.ts}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {clientName || title}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {messages.length > 0 ? 'Active' : 'No messages yet'}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.text} />
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
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.subtle} />
                <Text style={styles.emptyStateText}>No messages yet</Text>
                <Text style={styles.emptyStateSubtext}>Start the conversation</Text>
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
              placeholder="Message"
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
                <ActivityIndicator size="small" color="#ffffff" />
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
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    ...TYPE.section,
  },
  headerSub: {
    ...TYPE.micro,
    color: COLORS.subtle,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
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
    borderRadius: RADIUS.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  input: {
    flex: 1,
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
    margin: 0,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    ...TYPE.section,
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
  },
});
