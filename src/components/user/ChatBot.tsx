'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, BookOpen, FileText, Video, Calendar, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUserLanguage } from '@/context/AppContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  results?: SearchResult[];
  quickActions?: QuickAction[];
}

interface SearchResult {
  result_type: 'course' | 'lesson' | 'file' | 'announcement';
  result_id: string;
  result_title: string;
  result_description: string;
  result_url: string;
  result_metadata: any;
}

interface QuickAction {
  label: string;
  action: string;
  icon?: React.ReactNode;
}

export function ChatBot() {
  const { t } = useUserLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Quick actions with translations
  const QUICK_ACTIONS: QuickAction[] = [
    {
      label: t('chatbot.quickAction.myCourses', 'My Courses'),
      action: 'הקורסים שלי', // Use Hebrew command that works with API
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: t('chatbot.quickAction.upcomingLessons', 'Upcoming Lessons'),
      action: 'שיעורים קרובים',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      label: t('chatbot.quickAction.recentFiles', 'Recent Files'),
      action: 'קבצים אחרונים',
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: t('chatbot.quickAction.myAssignments', 'My Assignments'),
      action: 'המטלות שלי',
      icon: <Video className="h-4 w-4" />
    },
  ];

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const WELCOME_MESSAGE = {
        id: 'welcome',
        type: 'bot' as const,
        content: t('chatbot.welcome', "Hi! I'm your learning assistant. I can help you find courses, lessons, files, and more. Try asking me something like 'show my courses' or search for a specific topic!"),
        timestamp: new Date(),
        quickActions: QUICK_ACTIONS,
      };
      setMessages([WELCOME_MESSAGE]);
    }
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSendMessage(message: string) {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 1. Try command detection first (my courses, upcoming lessons, etc.)
      const commandResponse = await fetch(
        `/api/user/search/commands?q=${encodeURIComponent(message)}`
      );
      const commandData = await commandResponse.json();

      if (commandData.success && commandData.results?.length > 0) {
        // Command found - get translated name
        const commandTranslationKey = `chatbot.command.${commandData.command}`;
        const commandName = t(commandTranslationKey, commandData.command.replace('_', ' '));

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: t('chatbot.response.hereAreYour', 'Here are your {item}:').replace('{item}', commandName),
          timestamp: new Date(),
          results: commandData.results.map((r: any) => ({
            result_type: 'course',
            result_id: r.id,
            result_title: r.title,
            result_description: r.course_title || '',
            result_url: r.url,
            result_metadata: r,
          })),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        return;
      }

      // 2. Try FAQ/Navigation search (profile, invoices, settings, etc.)
      const faqResponse = await fetch(
        `/api/user/search/faq?q=${encodeURIComponent(message)}`
      );
      const faqData = await faqResponse.json();

      if (faqData.success && faqData.results?.length > 0) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: t('chatbot.response.foundNavigation', 'I found these sections for you:'),
          timestamp: new Date(),
          results: faqData.results.map((r: any) => ({
            result_type: 'navigation',
            result_id: r.id,
            result_title: r.title,
            result_description: r.description,
            result_url: r.url,
            result_metadata: { icon: r.icon, category: r.category },
          })),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        return;
      }

      // 3. Fall back to full-text content search
      const searchResponse = await fetch(
        `/api/user/search?q=${encodeURIComponent(message)}`
      );
      const searchData = await searchResponse.json();

      if (searchData.success) {
        const allResults = [
          ...searchData.results.courses,
          ...searchData.results.lessons,
          ...searchData.results.files,
          ...searchData.results.announcements,
        ];

        if (allResults.length > 0) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: t('chatbot.response.foundResults', 'I found {count} result{plural} for "{query}":')
              .replace('{count}', allResults.length.toString())
              .replace('{plural}', allResults.length !== 1 ? 's' : '')
              .replace('{query}', message),
            timestamp: new Date(),
            results: allResults,
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: t('chatbot.response.noResults', 'I couldn\'t find anything matching "{query}". Try searching for courses, lessons, or files you\'re enrolled in.').replace('{query}', message),
            timestamp: new Date(),
            quickActions: QUICK_ACTIONS,
          };
          setMessages(prev => [...prev, botMessage]);
        }
      }
    } catch (error) {
      console.error('ChatBot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: t('chatbot.response.error', "Sorry, I encountered an error. Please try again."),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleQuickAction(action: string) {
    handleSendMessage(action);
  }

  function handleResultClick(url: string) {
    router.push(url);
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarFallback className="bg-white text-primary font-bold">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{t('chatbot.title', 'Learning Assistant')}</h3>
            <p className="text-xs text-white/90">{t('chatbot.status', 'Online • Ready to help')}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 flex-shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" dir="rtl">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  message.type === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-muted'
                )}
                dir="rtl"
              >
                <p className={cn(
                  "text-sm text-right",
                  message.type === 'user' ? 'text-white' : ''
                )}>{message.content}</p>

                {/* Results */}
                {message.results && message.results.length > 0 && (
                  <div className="mt-3 space-y-2" dir="rtl">
                    {message.results.slice(0, 5).map((result) => (
                      <button
                        key={result.result_id}
                        onClick={() => handleResultClick(result.result_url)}
                        className="w-full text-right p-3 bg-background hover:bg-accent rounded-lg transition-colors border"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0 text-right">
                            <p className="font-medium text-sm truncate text-right">{result.result_title}</p>
                            {result.result_description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 text-right">
                                {result.result_description}
                              </p>
                            )}
                            {result.result_metadata?.course_title && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {result.result_metadata.course_title}
                              </Badge>
                            )}
                          </div>
                          {result.result_type === 'course' && <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 mr-auto" />}
                          {result.result_type === 'lesson' && <Video className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 mr-auto" />}
                          {result.result_type === 'file' && <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 mr-auto" />}
                          {result.result_type === 'announcement' && <Navigation className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 mr-auto" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                {message.quickActions && (
                  <div className="mt-3 grid grid-cols-2 gap-2" dir="rtl">
                    {message.quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.action)}
                        className="flex justify-between gap-2 bg-background"
                      >
                        {action.icon}
                        <span className="text-xs flex-1 text-right">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                )}

                <p className={cn(
                  "text-xs opacity-60 mt-1 text-right",
                  message.type === 'user' ? 'text-white' : ''
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4" dir="rtl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2 flex-row-reverse"
        >
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('chatbot.placeholder', 'Ask me anything...')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 text-right"
            dir="rtl"
            disabled={isTyping}
          />
        </form>
      </div>
    </div>
  );
}
