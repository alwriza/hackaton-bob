'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User as UserIcon, Mail, ShieldCheck, Award,
  Settings, LogOut, ChevronRight, Briefcase, Star, Heart, Plus, ExternalLink, Loader2, DollarSign, Activity, AlertTriangle, Wallet, Lock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getTrustBreakdown } from '@/lib/trust';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [myServices, setMyServices] = useState<any[]>([]);
  const [trustStats, setTrustStats] = useState<any>(null);
  const [financials, setFinancials] = useState({ earned: 0, spent: 0, escrow: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfileData = async () => {
      // 1. My Services
      const { data: services } = await supabase
        .from('services')
        .select('id, title, price, rating, category, image')
        .eq('owner_id', user.id);
      setMyServices(services || []);

      // 2. Trust Stats
      const stats = await getTrustBreakdown(user.id);
      setTrustStats(stats);

      // 3. Financials
      // Earned: COMPLETED transactions where seller_id = user.id
      const { data: earnedTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'COMPLETED');
      const totalEarned = (earnedTx || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Spent: COMPLETED where buyer_id = user.id
      const { data: spentTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('buyer_id', user.id)
        .eq('status', 'COMPLETED');
      const totalSpent = (spentTx || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Escrow: ACTIVE or PENDING_REVIEW where seller_id = user.id
      const { data: escrowTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('seller_id', user.id)
        .in('status', ['ACTIVE', 'PENDING_REVIEW']);
      const totalEscrow = (escrowTx || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      setFinancials({ earned: totalEarned, spent: totalSpent, escrow: totalEscrow });
      setIsLoading(false);
    };

    fetchProfileData();
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-black">Вы не вошли в систему</h1>
        <Link href="/login" className="btn-primary py-4 px-8 inline-block">Войти</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* ── Profile Header ── */}
      <section className="bg-white rounded-[40px] p-8 border border-border card-shadow flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full animate-pulse" />

        <div className="relative">
          <div className="w-32 h-32 rounded-[32px] bg-accent border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-4xl font-black text-primary">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-success text-white p-2 rounded-xl shadow-lg border-2 border-white">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black">{user.name}</h1>
            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} />
              {user.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="px-4 py-1.5 bg-accent rounded-full text-xs font-bold text-primary flex items-center gap-2">
              <Award size={14} />
              {user.role === 'PARENT' ? 'Родитель' : 'Пользователь'}
            </div>
            <div className="px-4 py-1.5 bg-success/10 rounded-full text-xs font-bold text-success flex items-center gap-2 border border-success/20">
              <Star size={14} fill="currentColor" />
              Траст {user.trust_score || 100}%
            </div>
            {user.is_minor && (
              <div className="px-4 py-1.5 bg-blue-500/10 rounded-full text-xs font-bold text-blue-600 flex items-center gap-2 border border-blue-500/20">
                <ShieldCheck size={14} />
                Подросток
              </div>
            )}
            {user.is_verified && (
              <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full text-xs font-black text-indigo-600 flex items-center gap-2 border border-indigo-500/20 group relative cursor-help">
                <ShieldCheck size={14} />
                VERIFIED
                <div className="absolute top-10 flex hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg z-50 whitespace-nowrap shadow-xl">
                  <span>Age Verified</span>
                  <span>Confidence: {user.verification_confidence || 95}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!user.is_verified && user.role === 'USER' && (
            <Link
              href="/verify"
              className="px-4 py-2 rounded-xl font-black transition-all active:scale-95 bg-primary text-white hover:bg-primary/90 flex items-center gap-2 text-sm shadow-md"
            >
              <ShieldCheck size={18} />
              Пройти верификацию
            </Link>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl font-medium transition-all active:scale-95 bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center gap-2 text-sm font-bold w-full"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </section>

      {/* ── Stats Row: Trust Score & Financials ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Trust Score Breakdown */}
        <section className="bg-white rounded-[40px] p-8 border border-border card-shadow space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center text-warning">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Trust Score</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Аналитика репутации</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-primary">{user.trust_score || 100} <span className="text-sm text-muted-foreground font-bold">/ 100</span></span>
            </div>
            {/* Progress bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-success transition-all duration-1000" style={{ width: `${Math.min(60, (trustStats?.completed / (trustStats?.total || 1)) * 60 || 0)}%` }} title="Успешные сделки" />
              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(30, (1 - (trustStats?.disputed / (trustStats?.total || 1))) * 30 || 30)}%` }} title="Без споров" />
              <div className="h-full bg-accent transition-all duration-1000" style={{ width: '10%' }} title="Базовый рейтинг" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-2xl border border-border/40 text-center">
                <p className="text-xs font-bold text-muted-foreground mb-1">Успешные сделки</p>
                <p className="text-lg font-black text-success">{trustStats?.completed || 0}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-border/40 text-center">
                <p className="text-xs font-bold text-muted-foreground mb-1">Споры</p>
                <p className="text-lg font-black text-destructive">{trustStats?.disputed || 0}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Dashboard */}
        <section className="bg-white rounded-[40px] p-8 border border-border card-shadow space-y-6 relative overflow-hidden">
          {/* Decorative background for wallet */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-success/5 rounded-full blur-2xl" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Мой кошелёк</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Финансовая сводка</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="p-5 bg-success/5 border border-success/10 rounded-3xl flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-success/70 tracking-widest mb-1">Заработано всего</p>
                <p className="text-3xl font-black text-success">{financials.earned.toLocaleString()} ₸</p>
              </div>
              <ShieldCheck size={32} className="text-success opacity-20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-border/40">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 flex items-center gap-1">
                  <Lock size={12} /> В эскроу
                </p>
                <p className="text-xl font-black text-primary">{financials.escrow.toLocaleString()} ₸</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-border/40">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 text-destructive/70">Потрачено</p>
                <p className="text-xl font-black text-destructive">- {financials.spent.toLocaleString()} ₸</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Мои заказы', href: '/orders', icon: ShieldCheck, color: 'text-primary' },
          { label: 'Мои услуги', href: '/my-services', icon: Briefcase, color: 'text-success' },
          { label: 'Каталог', href: '/browse', icon: Heart, color: 'text-warning' },
          { label: 'Создать услугу', href: '/create', icon: Plus, color: 'text-secondary' },
        ].map(item => (
          user?.role === 'USER' && !user?.is_verified && (item.href === '/create') ? (
            <Link
              key={item.href}
              href="/verify"
              className="bg-white rounded-[32px] p-6 border border-destructive/20 hover:border-destructive hover:shadow-premium transition-all group flex flex-col items-center gap-3 text-center"
            >
              <div className={`p-4 bg-destructive/10 rounded-2xl transition-all text-destructive`}>
                <AlertTriangle size={28} />
              </div>
              <span className="text-sm font-black text-destructive transition-colors">Нужна верификация</span>
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-[32px] p-6 border border-border hover:shadow-premium transition-all group flex flex-col items-center gap-3 text-center"
            >
              <div className={`p-4 bg-accent/5 rounded-2xl group-hover:bg-primary/5 transition-all ${item.color}`}>
                <item.icon size={28} />
              </div>
              <span className="text-sm font-black text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
            </Link>
          )
        ))}
      </div>

      {/* ── My Active Services ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">Мои услуги</h2>
          <Link href="/create" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
            <Plus size={16} /> Создать
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : myServices.length > 0 ? (
          <div className="space-y-3">
            {myServices.map((service) => (
              <Link
                key={service.id}
                href={`/service/${service.id}`}
                className="bg-white border border-border rounded-[32px] p-4 flex gap-5 transition-all hover:shadow-premium hover:-translate-y-1 group"
              >
                <div className="w-20 h-20 rounded-2xl bg-accent overflow-hidden shrink-0">
                  <img
                    src={service.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 py-1 space-y-1">
                  <h3 className="font-black text-lg group-hover:text-primary transition-colors">{service.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-sm font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{service.price.toLocaleString()} ₸</p>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{service.category}</span>
                    {service.rating && (
                      <div className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded-lg">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-black text-warning">{service.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={20} className="text-primary" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 bg-white rounded-[40px] border border-border border-dashed text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Briefcase size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-foreground font-black">У вас пока нет активных услуг.</p>
              <p className="text-xs text-muted-foreground font-medium">Создайте первую услугу и начните зарабатывать.</p>
            </div>
            <Link href="/create" className="btn-primary inline-flex mt-4 py-3 px-6 text-sm">
              Предложить услугу
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
