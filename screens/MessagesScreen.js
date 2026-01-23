import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostNotifications } from '../services/notificationService';
import { getSupportConversation } from '../services/supportService';
import { getHostConversations } from '../services/messageService';

export default function MessagesScreen({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [supportConversation, setSupportConversation] = useState(null);
  const [isLoadingSupport, setIsLoadingSupport] = useState(true);
  const [clientConversations, setClientConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const checkUnreadNotifications = async () => {
    try {
      const result = await getHostNotifications();
      if (result.success && result.notifications) {
        const unread = result.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error checking unread notifications:', error);
      setUnreadCount(0);
    }
  };

  const formatTimestamp = (createdAt) => {
    if (!createdAt) return null;
    
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return null;
    }
  };

  const loadClientConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const result = await getHostConversations();
      if (result.success && result.conversations) {
        // Map API response to UI format
        const mappedConversations = result.conversations.map((conv) => {
          const lastMessage = conv.messages && conv.messages.length > 0 
            ? conv.messages[conv.messages.length - 1] 
            : null;
          
          return {
            id: conv.id,
            clientId: conv.client_id,
            clientName: conv.client_name || 'Client',
            clientEmail: conv.client_email,
            lastMessage: lastMessage?.message || null,
            timestamp: lastMessage ? formatTimestamp(lastMessage.created_at) : formatTimestamp(conv.last_message_at),
            createdAt: lastMessage?.created_at || conv.last_message_at,
            hasUnread: !conv.is_read_by_host,
            unreadCount: conv.messages?.filter(m => !m.is_read && m.sender_type === 'client').length || 0,
          };
        });
        
        // Sort by last message time (most recent first)
        mappedConversations.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        
        setClientConversations(mappedConversations);
        setUnreadCount(result.unreadCount || 0);
      } else {
        setClientConversations([]);
      }
    } catch (error) {
      console.error('Error loading client conversations:', error);
      setClientConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadSupportConversation = async () => {
    setIsLoadingSupport(true);
    try {
      const result = await getSupportConversation();
      if (result.success && result.messages) {
        // Get the last message for preview
        const messages = result.messages || [];
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          setSupportConversation({
            id: 'support',
            title: 'Customer Support',
            lastMessage: lastMessage.text,
            timestamp: formatTimestamp(lastMessage.createdAt) || lastMessage.ts || 'Just now',
            createdAt: lastMessage.createdAt,
            hasUnread: false, // Can be enhanced later if API provides unread status
          });
        } else {
          // No messages yet, but conversation exists
          setSupportConversation({
            id: 'support',
            title: 'Customer Support',
            lastMessage: null,
            timestamp: null,
            createdAt: null,
            hasUnread: false,
          });
        }
      } else {
        setSupportConversation(null);
      }
    } catch (error) {
      console.error('Error loading support conversation:', error);
      setSupportConversation(null);
    } finally {
      setIsLoadingSupport(false);
    }
  };

  // Check unread count on mount
  useEffect(() => {
    checkUnreadNotifications();
    loadSupportConversation();
    loadClientConversations();
  }, []);

  // Refresh when screen is focused (e.g., when returning from notifications or customer support screen)
  useFocusEffect(
    useCallback(() => {
      checkUnreadNotifications();
      loadSupportConversation();
      loadClientConversations();
    }, [])
  );

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
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={24} color="#000000" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <View style={styles.notificationDot} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Your conversations</Text>

        {/* Support Conversation Thread */}
        {isLoadingSupport ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.text} />
          </View>
        ) : supportConversation ? (
          <TouchableOpacity
            style={styles.threadCard}
            onPress={() => {
              lightHaptic();
              navigation.navigate('CustomerSupport');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.threadLeft}>
              <Image 
                source={require('../assets/icons/49036.jpg')} 
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.threadBody}>
              <View style={styles.threadTop}>
                <Text style={styles.threadTitle}>{supportConversation.title}</Text>
                {supportConversation.timestamp && (
                  <Text style={styles.threadTime}>{supportConversation.timestamp}</Text>
                )}
              </View>
              {supportConversation.lastMessage ? (
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {supportConversation.lastMessage}
                </Text>
              ) : (
                <Text style={styles.threadPreview} numberOfLines={1}>
                  Start a conversation with our support team
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Client Conversations */}
        {isLoadingConversations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.text} />
          </View>
        ) : clientConversations.length > 0 ? (
          clientConversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.threadCard}
              onPress={() => {
                lightHaptic();
                navigation.navigate('Chat', {
                  clientId: conv.clientId,
                  clientName: conv.clientName,
                  conversationId: conv.id,
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.threadLeft}>
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={COLORS.subtle} />
                </View>
                {conv.hasUnread && conv.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.threadBody}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadTitle}>{conv.clientName}</Text>
                  {conv.timestamp && (
                    <Text style={styles.threadTime}>{conv.timestamp}</Text>
                  )}
                </View>
                {conv.lastMessage ? (
                  <Text style={[styles.threadPreview, conv.hasUnread && styles.threadPreviewUnread]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                ) : (
                  <Text style={styles.threadPreview} numberOfLines={1}>
                    No messages yet
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : null}

        {/* Empty State - Only show if no conversations exist */}
        {!isLoadingSupport && !isLoadingConversations && !supportConversation && clientConversations.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.subtle} />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your conversations with guests will appear here
            </Text>
          </View>
        )}
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
    paddingVertical: SPACING.m,
    paddingLeft: 0,
    paddingRight: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  unreadBadgeText: {
    ...TYPE.micro,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  threadPreviewUnread: {
    fontWeight: '600',
    color: COLORS.text,
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
  notificationIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
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
  loadingContainer: {
    paddingVertical: SPACING.m,
    alignItems: 'center',
  },
});
