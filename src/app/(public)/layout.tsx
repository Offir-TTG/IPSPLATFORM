import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster />
      </ThemeProvider>
    </AppProvider>
  );
}
