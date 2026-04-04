import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getClientConversation, sendMessageToClient } from '../services/messageService';
import { fetchClientAvatarFromSupabase } from '../services/mediaService';

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
  const [clientAvatarUri, setClientAvatarUri] = useState(route?.params?.clientAvatarUrl || null);

  const listRef = useRef(null);

  const parseUTC = (raw) => {
    const s = String(raw);
    const hasTimezone = s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s);
    return new Date(hasTimezone ? s : s + 'Z');
  };

  const localTime = (d) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const formatTime = (createdAt) => {
    if (!createdAt) return 'Now';
    try {
      const date = parseUTC(createdAt);
      if (isNaN(date.getTime())) return 'Now';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      return localTime(date);
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
      let avatar =
        route?.params?.clientAvatarUrl ||
        null;

      if (result.success && result.conversation) {
        const c = result.conversation;
        avatar =
          avatar ||
          c.client_avatar_url ||
          c.client_avatar ||
          c.client?.avatar_url ||
          c.client?.profile_image_uri ||
          c.participant?.avatar_url ||
          null;
        const clientMsg = (c.messages || []).find(
          (m) => m.sender_type !== 'host' && m.sender_avatar_url
        );
        if (clientMsg?.sender_avatar_url) {
          avatar = avatar || clientMsg.sender_avatar_url;
        }

        const mappedMessages = (c.messages || []).map((msg) => ({
          id: msg.id.toString(),
          fromMe: msg.sender_type === 'host',
          text: msg.message,
          ts: formatTime(msg.created_at),
          createdAt: msg.created_at,
          isRead: msg.is_read,
          senderAvatarUrl: msg.sender_avatar_url,
        }));

        setMessages(mappedMessages);
      } else {
        setMessages([]);
        if (result.error) {
          console.error('Error loading conversation:', result.error);
        }
      }

      if (!avatar && clientId) {
        try {
          const fromStorage = await fetchClientAvatarFromSupabase(clientId);
          if (fromStorage) avatar = fromStorage;
        } catch (_) {}
      }
      setClientAvatarUri(avatar || null);
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
    setClientAvatarUri(route?.params?.clientAvatarUrl || null);
  }, [clientId, route?.params?.clientAvatarUrl]);

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

    const now = new Date();
    const tempMessage = {
      id: `temp-${Date.now()}`,
      fromMe: true,
      text,
      ts: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      createdAt: now.toISOString(),
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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerAvatarOuter}>
          {clientAvatarUri ? (
            <Image source={{ uri: clientAvatarUri }} style={styles.headerAvatar} resizeMode="cover" />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={22} color={COLORS.subtle} />
            </View>
          )}
        </View>

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
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && styles.listContentEmpty,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  {clientAvatarUri ? (
                    <Image source={{ uri: clientAvatarUri }} style={styles.emptyAvatar} resizeMode="cover" />
                  ) : (
                    <Ionicons name="chatbubbles-outline" size={40} color={COLORS.brand} />
                  )}
                </View>
                <Text style={styles.emptyStateTitle}>No messages yet</Text>
                <Text style={styles.emptyStateSub}>Send a message to start the conversation</Text>
              </View>
            }
          />
        )}

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, SPACING.m) }]}>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Message"
              placeholderTextColor={COLORS.subtle}
              multiline
              maxHeight={120}
              returnKeyType="default"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (Platform.OS === 'ios') return;
                send();
              }}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={send}
              activeOpacity={0.7}
              disabled={!draft.trim() || isSending}
              accessibilityLabel="Send message"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
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
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarOuter: {
    marginRight: 2,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.borderStrong,
  },
  headerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderVisible,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    width: 40,
    height: 40,
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
    paddingBottom: SPACING.l,
  },
  listContentEmpty: {
    flexGrow: 1,
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
    paddingTop: SPACING.m,
    backgroundColor: COLORS.bg,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: RADIUS.lg,
    paddingLeft: SPACING.m,
    paddingRight: SPACING.s,
    paddingVertical: SPACING.s,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderVisible,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    lineHeight: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },
  sendButtonDisabled: {
    opacity: 0.38,
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
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.l,
    minHeight: 280,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
    overflow: 'hidden',
  },
  emptyAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  emptyStateTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  emptyStateSub: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    textAlign: 'center',
    maxWidth: 280,
  },
});
