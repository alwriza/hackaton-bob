'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function WithVerification({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'USER' && !user.is_verified) {
        router.push('/verify');
      } else if (user.role === 'USER' && user.is_minor && !user.parent_id && !user.parent_email) {
         // Also enforce parent linking if they skipped it
         router.push('/parent-link');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  // If user is a USER but not verified, show loader while redirecting
  if (user.role === 'USER' && (!user.is_verified || (user.is_minor && !user.parent_id && !user.parent_email))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 size={48} className="animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Проверка уровня доступа...</p>
      </div>
    );
  }

  return <>{children}</>;
}
