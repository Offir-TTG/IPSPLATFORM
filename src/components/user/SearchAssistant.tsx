'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Video, Bell, Book, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  result_type: 'course' | 'lesson' | 'file' | 'announcement';
  result_id: string;
  result_title: string;
  result_description: string;
  result_url: string;
  result_metadata: any;
  relevance: number;
}

interface GroupedResults {
  courses: SearchResult[];
  lessons: SearchResult[];
  files: SearchResult[];
  announcements: SearchResult[];
}

export function SearchAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [commandResults, setCommandResults] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search on query change
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      setCommandResults(null);
      return;
    }

    performSearch(debouncedQuery);
  }, [debouncedQuery]);

  async function performSearch(searchQuery: string) {
    setIsSearching(true);

    try {
      // Try command detection first
      const commandResponse = await fetch(
        `/api/user/search/commands?q=${encodeURIComponent(searchQuery)}`
      );
      const commandData = await commandResponse.json();

      if (commandData.success && commandData.results?.length > 0) {
        setCommandResults(commandData);
        setResults(null);
        setIsSearching(false);
        return;
      }

      // Fall back to full-text search
      const searchResponse = await fetch(
        `/api/user/search?q=${encodeURIComponent(searchQuery)}`
      );
      const searchData = await searchResponse.json();

      if (searchData.success) {
        setResults(searchData.results);
        setCommandResults(null);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleResultClick(url: string) {
    router.push(url);
    setIsOpen(false);
    setQuery('');
    setResults(null);
  }

  const totalResults = results
    ? results.courses.length + results.lessons.length +
      results.files.length + results.announcements.length
    : 0;

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[20%] z-50 w-full max-w-2xl translate-x-[-50%] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b p-4">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search courses, lessons, files... or try 'my courses', 'upcoming lessons'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[60vh] p-4">
          {!query && (
            <div className="text-sm text-gray-500 space-y-2">
              <p className="font-medium">Try these commands:</p>
              <ul className="space-y-1 pl-4">
                <li>• "my courses" - View all your courses</li>
                <li>• "upcoming lessons" - See upcoming sessions</li>
                <li>• "recent files" - Latest uploaded materials</li>
                <li>• "my assignments" - Pending homework</li>
              </ul>
            </div>
          )}

          {commandResults && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-500">
                {commandResults.command.replace('_', ' ').toUpperCase()}
              </h3>
              {commandResults.results.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                  onClick={() => handleResultClick(item.url)}
                >
                  <div className="font-medium">{item.title}</div>
                  {item.course_title && (
                    <div className="text-sm text-gray-500">{item.course_title}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {totalResults === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results found for "{query}"
                </div>
              )}

              {/* Courses */}
              {results.courses.length > 0 && (
                <ResultGroup
                  title="Courses"
                  icon={<Book className="h-4 w-4" />}
                  results={results.courses}
                  onResultClick={handleResultClick}
                />
              )}

              {/* Lessons */}
              {results.lessons.length > 0 && (
                <ResultGroup
                  title="Lessons"
                  icon={<Video className="h-4 w-4" />}
                  results={results.lessons}
                  onResultClick={handleResultClick}
                />
              )}

              {/* Files */}
              {results.files.length > 0 && (
                <ResultGroup
                  title="Files"
                  icon={<FileText className="h-4 w-4" />}
                  results={results.files}
                  onResultClick={handleResultClick}
                />
              )}

              {/* Announcements */}
              {results.announcements.length > 0 && (
                <ResultGroup
                  title="Announcements"
                  icon={<Bell className="h-4 w-4" />}
                  results={results.announcements}
                  onResultClick={handleResultClick}
                />
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

interface ResultGroupProps {
  title: string;
  icon: React.ReactNode;
  results: SearchResult[];
  onResultClick: (url: string) => void;
}

function ResultGroup({ title, icon, results, onResultClick }: ResultGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
        {icon}
        <span>{title}</span>
        <Badge variant="secondary">{results.length}</Badge>
      </div>
      <div className="space-y-1">
        {results.map((result) => (
          <div
            key={result.result_id}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
            onClick={() => onResultClick(result.result_url)}
          >
            <div className="font-medium">{result.result_title}</div>
            {result.result_description && (
              <div className="text-sm text-gray-500 line-clamp-1">
                {result.result_description}
              </div>
            )}
            {result.result_metadata?.course_title && (
              <div className="text-xs text-gray-400 mt-1">
                in {result.result_metadata.course_title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
