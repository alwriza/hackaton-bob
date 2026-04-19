'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, ArrowRight, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ParentLinkPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  
  const [parentEmail, setParentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.parent_email && !parentEmail) {
      setParentEmail(user.parent_email);
    }
  }, [user]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Find parent profile
      const { data: parentProfile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', parentEmail)
        .eq('role', 'PARENT')
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let parentId = null;

      if (parentProfile) {
        parentId = parentProfile.id;
      }

      // Update child profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          parent_email: parentEmail,
          parent_id: parentId
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError('Не удалось связать аккаунты. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-[48px] p-10 text-center space-y-6 shadow-premium border border-border/40 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-success/10 text-success rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black">Связка установлена!</h2>
          <p className="text-muted-foreground font-medium">Аккаунт закреплен за родителем: <b>{parentEmail}</b></p>
          <button onClick={() => router.push('/')} className="w-full btn-primary py-5 mt-4">
            Войти на платформу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white rounded-[48px] p-12 shadow-premium border border-border/40 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
             <LinkIcon size={32} />
          </div>
          <h1 className="text-3xl font-black">Семейная привязка</h1>
          <p className="text-muted-foreground font-medium text-sm">
            Вам меньше 18 лет. Для допуска к платформе укажите актуальный Email вашего родителя. 
            Если аккаунт родителя еще не создан, мы вышлем приглашение (MVP: просто сохраняем email).
          </p>
        </div>

        <form onSubmit={handleLink} className="space-y-6">
          {error && <div className="p-4 bg-destructive/10 text-destructive text-sm font-bold rounded-2xl">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-6">Email родителя</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-secondary transition-colors" size={20} />
              <input
                type="email"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full pl-16 pr-6 py-5 rounded-[32px] border border-border/60 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-secondary/5 focus:border-secondary/20 transition-all font-medium text-lg"
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !parentEmail}
            className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-[32px] py-5 text-lg font-black shadow-lg shadow-secondary/20 disabled:opacity-50 transition-all flex justify-center items-center gap-3"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
              <>Привязать аккаунт <ArrowRight size={20} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
