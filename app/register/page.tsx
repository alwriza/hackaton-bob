'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, ArrowRight, Mail, Lock, 
  AlertCircle, Loader2, ArrowLeft, User,
  Briefcase, Users, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

type UserRole = 'USER' | 'PARENT';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [parentEmail, setParentEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile entry
        // NOTE: In a production app, you might use a Supabase Trigger to create the profile.
        // For this implementation, we'll do it manually.
        let isMinor = false;
        if (role === 'USER' && dateOfBirth) {
          const ageDiffMs = Date.now() - new Date(dateOfBirth).getTime();
          const ageDate = new Date(ageDiffMs);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          isMinor = age < 18;
        }

        const profileData = {
          id: authData.user.id,
          name,
          role,
          parent_email: role === 'USER' ? parentEmail || null : null,
          date_of_birth: role === 'USER' ? dateOfBirth || null : null,
          is_minor: role === 'USER' ? isMinor : false,
          trust_score: 100,
          balance: 0,
          completed_jobs: 0,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          // If the profileError is about a missing column (because they didn't run SQL)
          if (profileError.code === '42703') {
            console.warn('Fallback profile insert (missing new columns from SQL migration).');
            const fallbackData = {
              id: authData.user.id,
              name,
              role,
              trust_score: 100,
              balance: 0,
              completed_jobs: 0,
            };
            const { error: fallbackError } = await supabase.from('profiles').insert(fallbackData);
            if (fallbackError) {
               setError('Ошибка при настройке профиля. Войдите еще раз.');
               return;
            }
          } else {
            console.error('Profile creation error:', profileError);
            setError('Аккаунт создан, но возникла ошибка. Пожалуйста, войдите и обновите данные.');
            return;
          }
        }

        // Force a session refresh/login just to ensure the client acknowledges it
        await supabase.auth.signInWithPassword({ email, password });

        if (role === 'USER') {
          router.push('/verify');
        } else {
          router.push('/');
        }
        router.refresh();
      }

    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs = [
    { 
      id: 'USER' as UserRole, 
      label: 'Пользователь', 
      desc: 'Хочу работать или стать заказчиком', 
      icon: User,
      color: 'bg-primary/10 text-primary',
      activeColor: 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
    },
    { 
      id: 'PARENT' as UserRole, 
      label: 'Родитель', 
      desc: 'Контролирую безопасность ребенка', 
      icon: Users,
      color: 'bg-secondary/10 text-secondary',
      activeColor: 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20'
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50/50">
      <div className="max-w-xl w-full space-y-8 bg-white p-12 rounded-[64px] border border-border/40 shadow-premium animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-bold text-xs uppercase tracking-widest mb-4">
            <ArrowLeft size={16} />
            Уже есть аккаунт? Войти
          </Link>
          <h2 className="text-4xl font-black tracking-tight">Создать профиль</h2>
          <p className="text-muted-foreground font-medium italic">
            Присоединяйтесь к бирже безопасного фриланса
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-10">
          {error && (
            <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex items-center gap-3 text-destructive text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-6">Кто вы на платформе?</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roleConfigs.map((cfg) => (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => setRole(cfg.id)}
                  className={`relative p-5 rounded-[32px] border transition-all text-left flex flex-col gap-3 group overflow-hidden ${
                    role === cfg.id 
                    ? cfg.activeColor
                    : 'bg-white border-border/60 hover:border-primary/40'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    role === cfg.id ? 'bg-white/20' : cfg.color
                  }`}>
                    <cfg.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black">{cfg.label}</p>
                    <p className={`text-[9px] font-bold opacity-60 leading-tight mt-1 ${role === cfg.id ? 'text-white' : 'text-muted-foreground'}`}>
                      {cfg.desc}
                    </p>
                  </div>
                  {role === cfg.id && (
                    <CheckCircle2 size={16} className="absolute top-4 right-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-6">Ваше имя</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 rounded-[32px] border border-border/60 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                  placeholder="Александр"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-6">Email</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 rounded-[32px] border border-border/60 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-6">Пароль</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 rounded-[32px] border border-border/60 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {role === 'USER' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-6">Дата рождения *</label>
                  <div className="relative group">
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-6 py-5 rounded-[32px] border border-border/60 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-muted-foreground focus:text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-6 flex items-center gap-2">
                    Email родителя (Опекуна)
                    <span className="text-secondary bg-secondary/10 px-2 rounded-full text-[8px] uppercase">Важно если вам нет 18</span>
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="email"
                      required={!!dateOfBirth && (Math.abs(new Date(Date.now() - new Date(dateOfBirth).getTime()).getUTCFullYear() - 1970) < 18)}
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 rounded-[32px] border border-border/60 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                      placeholder="parent@example.com"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-5 text-xs font-medium text-secondary-foreground leading-relaxed flex items-start gap-3">
            <ShieldCheck size={24} className="text-secondary shrink-0" />
            <div>
              <span className="font-black text-secondary tracking-widest uppercase text-[10px] block mb-1">Для родителей</span>
              Родители могут зарегистрироваться с ролью «Родитель», чтобы следить за балансом и активностью своих детей, а также блокировать сомнительные сделки.
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-6 text-xl shadow-2xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Зарегистрироваться
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-muted-foreground font-medium px-8 leading-relaxed">
              Нажимая кнопку, вы соглашаетесь с правилами платформы и политикой конфиденциальности. 
              Для подростков до 18 лет требуется верификация родителя после регистрации.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
