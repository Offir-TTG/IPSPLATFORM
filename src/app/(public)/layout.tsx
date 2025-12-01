import { AppProvider } from '@/context/AppContext';
import '@/app/globals.css';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AppProvider>
  );
}
