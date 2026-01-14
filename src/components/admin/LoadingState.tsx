'use client';

import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface LoadingStateProps {
  /**
   * Type of loading state
   * - 'page': Full page load (min-h-screen)
   * - 'section': Section/content area load (min-h-[400px])
   * - 'inline': Inline/small content area
   */
  variant?: 'page' | 'section' | 'inline';

  /**
   * Whether to wrap in AdminLayout (only for page variant)
   */
  withLayout?: boolean;

  /**
   * Custom spinner size (defaults based on variant)
   */
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  variant = 'section',
  withLayout = true,
  size
}: LoadingStateProps) {

  // Determine spinner size
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const defaultSize = variant === 'page' ? 'lg' : variant === 'section' ? 'md' : 'sm';
  const spinnerSize = size || defaultSize;

  // Determine container height
  const heightClasses = {
    page: 'min-h-screen',
    section: 'min-h-[400px]',
    inline: 'py-8',
  };

  const loadingContent = (
    <div className={`flex items-center justify-center ${heightClasses[variant]}`}>
      <Loader2 className={`${sizeClasses[spinnerSize]} animate-spin text-primary`} />
    </div>
  );

  if (variant === 'page' && withLayout) {
    return (
      <AdminLayout>
        {loadingContent}
      </AdminLayout>
    );
  }

  return loadingContent;
}

// Button Loading Component
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
