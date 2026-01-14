'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /**
   * Type of loading state
   * - 'page': Full page load (min-h-screen)
   * - 'section': Section/content area load (min-h-[60vh])
   * - 'inline': Inline/small content area (py-12)
   * - 'card': Loading inside a card component
   */
  variant?: 'page' | 'section' | 'inline' | 'card';

  /**
   * Custom spinner size (defaults based on variant)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom className for the container
   */
  className?: string;
}

export function LoadingState({
  variant = 'section',
  size,
  className = ''
}: LoadingStateProps) {

  // Determine spinner size
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const defaultSize = variant === 'page' ? 'lg' : variant === 'section' ? 'md' : 'sm';
  const spinnerSize = size || defaultSize;

  // Determine container classes based on variant
  const containerClasses = {
    page: 'flex items-center justify-center min-h-screen',
    section: 'flex items-center justify-center min-h-[60vh]',
    inline: 'flex items-center justify-center py-12',
    card: 'flex flex-col items-center justify-center p-12',
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <Loader2 className={`${sizeClasses[spinnerSize]} animate-spin text-primary`} />
    </div>
  );
}

// Button Loading Component for user-facing buttons
interface ButtonContentProps {
  /**
   * Whether the button is in loading state
   */
  loading: boolean;

  /**
   * Content to show when loading
   */
  loadingText?: string;

  /**
   * Content to show when not loading
   */
  children: React.ReactNode;

  /**
   * Icon to show when not loading (optional)
   */
  icon?: React.ReactNode;

  /**
   * RTL support
   */
  isRtl?: boolean;
}

export function ButtonContent({
  loading,
  loadingText,
  children,
  icon,
  isRtl = false
}: ButtonContentProps) {
  if (loading) {
    return (
      <>
        <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
        {loadingText && <span suppressHydrationWarning>{loadingText}</span>}
      </>
    );
  }

  return (
    <>
      {icon && <span className={isRtl ? 'ml-2' : 'mr-2'}>{icon}</span>}
      {children}
    </>
  );
}

// Inline Loader - for loading specific sections without taking full height
interface InlineLoaderProps {
  /**
   * Optional loading message
   */
  message?: string;

  /**
   * Size of the spinner
   */
  size?: 'sm' | 'md' | 'lg';
}

export function InlineLoader({ message, size = 'md' }: InlineLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && (
        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
          {message}
        </span>
      )}
    </div>
  );
}
