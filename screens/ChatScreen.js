import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function ChatScreen({ navigation, route }) {
  const title = route?.params?.title || 'Chat';
  const insets = useSafeAreaInsets();

  // Messages - to be fetched from API
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  const listRef = useRef(null);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
    });
    return () => sub.remove();
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;

    lightHaptic();

    const next = {
      id: `m-${Date.now()}`,
      fromMe: true,
      text,
      ts: 'Now',
    };

    setMessages((prev) => [...prev, next]);
    setDraft('');

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });
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
            {title}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            Active now
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
        />

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
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
              onPress={send}
              activeOpacity={0.85}
              disabled={!draft.trim()}
            >
              <Ionicons name="arrow-up" size={18} color={'#ffffff'} />
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
});
