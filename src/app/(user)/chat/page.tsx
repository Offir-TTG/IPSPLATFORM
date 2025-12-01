'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle,
  Send,
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Paperclip,
  Smile,
  MoreVertical,
} from 'lucide-react';
import { useChat, type Conversation, type Message } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { useUserLanguage } from '@/context/AppContext';

export default function ChatPage() {
  const { t } = useUserLanguage();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    messages,
    loading,
    sending,
    error,
    sendMessage,
  } = useChat(selectedConversation || undefined);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].conversation_id);
    }
  }, [conversations, selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const content = messageInput;
    setMessageInput('');

    await sendMessage(selectedConversation, content);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.conversation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.context_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(
    (conv) => conv.conversation_id === selectedConversation
  );

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{t('user.chat.loadingChats', 'Loading chats...')}</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 py-6">
      {/* Conversations Sidebar */}
      <Card className="w-80 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">{t('user.chat.messages', 'Messages')}</h2>
          <div className="relative">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('user.chat.searchConversations', 'Search conversations...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingInlineStart: '2.5rem',
                paddingInlineEnd: '0.75rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                backgroundColor: 'hsl(var(--muted))',
                border: 'none',
                borderRadius: 'calc(var(--radius) * 1.5)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
              }}
              className="focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('user.chat.noConversationsYet', 'No conversations yet')}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => {
                const isActive = conv.conversation_id === selectedConversation;
                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv.conversation_id)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      textAlign: 'start',
                      backgroundColor: isActive ? 'hsl(var(--accent))' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    className="hover:bg-accent/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 relative">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{
                            background: conv.context_type === 'program'
                              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                              : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          }}
                        >
                          {conv.context_type === 'program' ? (
                            <GraduationCap className="h-5 w-5" />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 h-5 min-w-[20px] px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] font-semibold flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {conv.conversation_name}
                          </h3>
                          {conv.last_message_at && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ltr:ml-2 rtl:mr-2">
                              {formatDistanceToNow(new Date(conv.last_message_at), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 truncate">
                          {conv.context_name}
                        </p>
                        {conv.last_message_content && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message_sender_name}: {conv.last_message_content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('user.chat.selectConversation', 'Select a conversation')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('user.chat.chooseConversation', 'Choose a conversation from the sidebar to start chatting')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{
                    background: activeConversation?.context_type === 'program'
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  }}
                >
                  {activeConversation?.context_type === 'program' ? (
                    <GraduationCap className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{activeConversation?.conversation_name}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {activeConversation?.participant_count} {t('user.chat.participants', 'participants')} • {activeConversation?.context_name}
                  </p>
                </div>
              </div>
              <button
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                className="hover:bg-accent"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('user.chat.noMessages', 'No messages yet. Start the conversation!')}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isCurrentUser = message.sender_id === message.sender.id; // This needs actual auth user ID
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.first_name, message.sender.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? 'items-end' : 'items-start'
                        }`}
                        style={{ maxWidth: '70%' }}
                      >
                        {showAvatar && (
                          <span className="text-xs text-muted-foreground mb-1 px-3">
                            {message.sender.first_name} {message.sender.last_name}
                          </span>
                        )}
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'calc(var(--radius) * 2)',
                            backgroundColor: isCurrentUser
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--muted))',
                            color: isCurrentUser
                              ? 'hsl(var(--primary-foreground))'
                              : 'hsl(var(--foreground))',
                          }}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-3">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  className="hover:bg-accent"
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={t('user.chat.typeMessage', 'Type a message...')}
                    rows={1}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'hsl(var(--muted))',
                      border: 'none',
                      borderRadius: 'calc(var(--radius) * 2)',
                      fontSize: 'var(--font-size-sm)',
                      resize: 'none',
                      outline: 'none',
                      minHeight: '44px',
                      maxHeight: '120px',
                    }}
                    className="focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  className="hover:bg-accent"
                >
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: messageInput.trim()
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted))',
                    color: messageInput.trim()
                      ? 'hsl(var(--primary-foreground))'
                      : 'hsl(var(--muted-foreground))',
                    border: 'none',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                    transition: 'opacity 0.2s',
                  }}
                  className="hover:opacity-90"
                >
                  <Send className="h-5 w-5 ltr:rotate-0 rtl:rotate-180" />
                </button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
