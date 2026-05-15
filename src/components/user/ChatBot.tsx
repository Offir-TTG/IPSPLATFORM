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
  const { t, direction } = useUserLanguage();
  const isRtl = direction === 'rtl';
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
        aria-label={t('chatbot.title', 'Learning Assistant')}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 flex items-center justify-between" dir={direction}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 border-2 border-white/40 shrink-0">
            <AvatarFallback className="bg-white text-primary font-bold">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{t('chatbot.title', 'Learning Assistant')}</h3>
            <p className="text-xs text-white/90 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              {t('chatbot.status', 'Online • Ready to help')}
            </p>
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

      {/* Messages — direction follows the user's language. Each message
          renders as: optional bot avatar + bubble + optional result/action
          attachments below the bubble (NOT inside it, so they get full
          width). Bubbles use asymmetric rounded corners for a speech-
          bubble feel: user bubbles point toward the user, bot bubbles
          point toward the bot avatar. */}
      <ScrollArea className="flex-1 px-3 py-4 bg-muted/20" dir={direction}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.type === 'user';
            const timeLabel = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col gap-1.5',
                  isUser ? 'items-end' : 'items-start'
                )}
              >
                {/* Bubble row: bot has an avatar to the start, user is bubble-only. */}
                <div
                  className={cn(
                    'flex items-end gap-2 max-w-[85%]',
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {!isUser && (
                    <Avatar className="h-7 w-7 shrink-0 border border-border">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-[10px] font-semibold">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                      isUser
                        ? cn(
                            'bg-gradient-to-br from-primary to-purple-600 rounded-2xl',
                            // Tail pointing toward the user (start-side bottom corner squared).
                            isRtl ? 'rounded-bl-md' : 'rounded-br-md'
                          )
                        : cn(
                            'bg-background border border-border rounded-2xl',
                            isRtl ? 'rounded-br-md' : 'rounded-bl-md'
                          )
                    )}
                  >
                    {/* Force the color on the <p> itself rather than relying on
                        inheritance — some global styles reset <p> color and
                        the user bubble was rendering black on purple. */}
                    <p
                      className={cn(
                        'whitespace-pre-wrap break-words',
                        isUser ? 'text-white' : 'text-foreground'
                      )}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>

                {/* Timestamp — sits below the bubble in a muted color so it
                    doesn't compete with the message text. */}
                <span
                  className={cn(
                    'text-[10px] text-muted-foreground/70 px-1',
                    isUser ? 'pe-1' : 'ps-9' // align under bot bubble (past the avatar)
                  )}
                >
                  {timeLabel}
                </span>

                {/* Search-result cards — rendered OUTSIDE the bubble so they
                    get full width and breathing room. Indented past the
                    avatar to visually belong to the bot message above. */}
                {message.results && message.results.length > 0 && (
                  <div className={cn('w-full space-y-1.5 mt-1', !isUser && 'ps-9')}>
                    {message.results.slice(0, 5).map((result) => {
                      const TypeIcon =
                        result.result_type === 'course' ? BookOpen :
                        result.result_type === 'lesson' ? Video :
                        result.result_type === 'file' ? FileText :
                        Navigation;
                      return (
                        <button
                          key={result.result_id}
                          onClick={() => handleResultClick(result.result_url)}
                          className="w-full text-start p-3 bg-background hover:bg-accent rounded-xl transition-all border border-border hover:border-primary/40 hover:shadow-sm group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                              <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{result.result_title}</p>
                              {result.result_description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {result.result_description}
                                </p>
                              )}
                              {result.result_metadata?.course_title && (
                                <Badge variant="secondary" className="mt-1.5 text-[10px] h-5 px-1.5">
                                  {result.result_metadata.course_title}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quick-action chips — also outside the bubble. Pill-shaped,
                    wrap freely instead of forcing a 2-column grid. */}
                {message.quickActions && message.quickActions.length > 0 && (
                  <div className={cn('flex flex-wrap gap-1.5 mt-1', !isUser && 'ps-9')}>
                    {message.quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.action)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator — matches the bot-message shape with avatar +
              bubble so it doesn't visually jump when the real reply arrives. */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <Avatar className="h-7 w-7 shrink-0 border border-border">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-[10px] font-semibold">
                  AI
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'bg-background border border-border px-4 py-3 rounded-2xl shadow-sm',
                  isRtl ? 'rounded-br-md' : 'rounded-bl-md'
                )}
              >
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input — direction-aware so the placeholder and caret sit correctly
          in both Hebrew and English. */}
      <div className="border-t p-3 bg-background" dir={direction}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2 items-center"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('chatbot.placeholder', 'Ask me anything...')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 rounded-full bg-background text-foreground placeholder:text-muted-foreground border-border focus-visible:ring-1 focus-visible:ring-primary"
            dir={direction}
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isTyping}
            className="rounded-full bg-gradient-to-br from-primary to-purple-600 shrink-0 shadow-sm hover:shadow-md transition-shadow"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
