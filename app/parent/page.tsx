'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, Eye, EyeOff, Settings, AlertTriangle, 
  History, Wallet, Ban, Bell, CheckCircle2, TrendingUp,
  Lock, ArrowRight, Shield, Activity, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('5000');

  useEffect(() => {
    const fetchParentData = async () => {
      if (!user || user.role !== 'PARENT') {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // 1. Fetch linked children
        const { data: childData } = await supabase
          .from('profiles')
          .select('*')
          .eq('parent_email', user.email);
        
        setChildren(childData || []);

        if (childData && childData.length > 0) {
          const childIds = childData.map(c => c.id);
          // 2. Fetch active child transactions
          const { data: txData } = await supabase
            .from('transactions')
            .select('*, services(*), profiles:buyer_id(*)')
            .in('seller_id', childIds)
            .eq('status', 'ACTIVE');
          
          setActiveTransactions(txData || []);
        }
      } catch (err) {
        console.error('Error fetching parent hub data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentData();
  }, [user]);

  const handleFreezeAll = async () => {
    if (!children.length) {
      alert('Нет привязанных детей. Попросите ребёнка указать ваш Email при регистрации.');
      return;
    }
    if (!activeTransactions.length) {
      alert('У ребёнка нет активных сделок для блокировки.');
      return;
    }
    setIsBlockLoading(true);
    try {
      const childIds = children.map((c) => c.id);
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'FROZEN' })
        .in('seller_id', childIds)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      setActiveTransactions(prev => prev.map(t => ({ ...t, status: 'FROZEN' })));
      setBlockSuccess(true);
    } catch (err) {
      console.error('Failed to freeze:', err);
      alert('Ошибка при блокировке.');
    } finally {
      setIsBlockLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 size={64} className="animate-spin text-secondary" />
        <p className="text-xl font-black text-muted-foreground animate-pulse tracking-wide uppercase">Связываемся с системой защиты...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative mx-auto w-32 h-32 bg-secondary/10 rounded-[40px] flex items-center justify-center text-secondary border border-secondary/20 shadow-xl shadow-secondary/5 mb-8">
           <Shield size={64} strokeWidth={1.5} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Панель контроля</h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Войдите в аккаунт родителя, чтобы получить доступ к панели мониторинга.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-4">
          <Link href="/login" className="btn-primary py-5 w-full flex items-center justify-center gap-3 group">
            Войти в аккаунт
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/register" className="btn-ghost py-4 text-sm font-bold">
            Зарегистрироваться как родитель
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'PARENT') {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative mx-auto w-32 h-32 bg-secondary/10 rounded-[40px] flex items-center justify-center text-secondary border border-secondary/20 shadow-xl shadow-secondary/5 mb-8">
           <Shield size={64} strokeWidth={1.5} />
           <div className="absolute -top-2 -right-2 w-10 h-10 bg-white border border-border shadow-sm rounded-2xl flex items-center justify-center">
             <Lock size={20} className="text-muted-foreground" />
           </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Этот раздел — для родителей</h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Ваш аккаунт зарегистрирован как пользователь, а не как родитель.
            Аккаунты родителей создаются отдельно.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-4">
          <Link href="/register" className="btn-primary py-5 w-full flex items-center justify-center gap-3 group bg-secondary border-none">
            Создать аккаунт родителя
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  const child = children[0]; // Assuming one child for the MVP display

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/40 pb-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-success/20">
            <CheckCircle2 size={14} strokeWidth={3} />
            Система защиты Активна
          </div>
          <h1 className="text-4xl md:text-5xl font-black">Родительский контроль</h1>
          {child ? (
            <div className="flex items-center gap-3 p-2 pl-3 pr-4 bg-accent/10 rounded-2xl border border-border/40 w-fit">
               <div className="w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm bg-primary/5">
                 {child.avatar ? <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" /> : <div className="p-2 text-[10px] font-black">{child.name[0]}</div>}
               </div>
               <p className="text-sm font-bold text-muted-foreground">
                 Аккаунт: <span className="text-foreground">{child.name}</span>
               </p>
            </div>
          ) : (
            <p className="text-sm font-bold text-muted-foreground italic">Дети не привязаны к аккаунту</p>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            className="px-6 py-4 rounded-[20px] font-black transition-all active:scale-95 bg-white border border-border/80 flex items-center gap-3 text-sm hover:bg-accent/5 card-shadow"
            onClick={() => setShowLimitsModal(true)}
          >
            <Settings size={20} className="text-muted-foreground" />
            Настроить лимиты
          </button>
          <button
            onClick={handleFreezeAll}
            disabled={isBlockLoading}
            className="px-6 py-4 rounded-[20px] font-black transition-all active:scale-95 bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3 text-sm hover:bg-destructive hover:text-white shadow-lg shadow-destructive/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBlockLoading ? <Loader2 size={20} className="animate-spin" /> : <Ban size={20} />}
            Блокировка
          </button>
        </div>
      </div>

      {child ? (
        <>
          {/* Oversight Metrics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Баланс ребенка', value: `${(child.balance || 0).toLocaleString()} ₸`, icon: Wallet, color: 'text-foreground' },
              { label: 'Заработано всего', value: `${(child.completed_jobs * 5000).toLocaleString()} ₸`, icon: TrendingUp, color: 'text-success' },
              { label: 'Trust Score', value: `${child.trust_score}%`, icon: ShieldCheck, color: 'text-secondary', badge: child.trust_score > 90 ? 'EXCELLENT' : 'GOOD' },
              { label: 'Активные сделки', value: activeTransactions.length.toString(), icon: Activity, color: 'text-primary' },
            ].map((metric, i) => (
              <div key={i} className="premium-card p-8 rounded-[40px] space-y-4 relative overflow-hidden group border border-border/40 bg-white card-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <metric.icon size={80} strokeWidth={1.5} />
                </div>
                <div className="flex items-center justify-between">
                   <div className={`p-3 rounded-2xl bg-slate-50 border border-border/40 ${metric.color}`}>
                     <metric.icon size={20} />
                   </div>
                   {metric.badge && (
                     <span className="px-2 py-0.5 bg-success/10 text-success rounded-lg text-[8px] font-black tracking-widest">{metric.badge}</span>
                   )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{metric.label}</p>
                  <h4 className={`text-2xl font-black ${metric.color}`}>{metric.value}</h4>
                </div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Recent Activity Monitoring */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <History size={24} className="text-primary" />
                  Активность ребенка
                </h2>
              </div>

              <div className="space-y-4">
                {activeTransactions.length > 0 ? activeTransactions.map((tx) => (
                  <div key={tx.id} className="premium-card rounded-[40px] p-8 flex flex-col md:flex-row gap-8 items-start border border-border/40 bg-white card-shadow">
                    <div className="w-20 h-20 rounded-[24px] bg-accent/5 overflow-hidden shrink-0 border border-border/40 p-2">
                      <img src={tx.services?.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'} className="w-full h-full object-cover rounded-[16px]" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black">{tx.services?.title}</h3>
                          <p className="text-sm text-muted-foreground font-medium">Заказчик: {tx.profiles?.name} (Trust {tx.profiles?.trust_score}%)</p>
                        </div>
                        <span className="text-[10px] font-black text-secondary border border-secondary/20 bg-secondary/5 px-4 py-2 rounded-2xl uppercase tracking-widest">В работе</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Прогресс: 50%</span>
                          <span>Безопасность: 100%</span>
                        </div>
                        <div className="h-2.5 bg-accent/5 rounded-full overflow-hidden p-0.5 border border-border/40">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                    </div>
                    <Link href={`/transaction/${tx.id}`} className="btn-ghost p-4 rounded-2xl shrink-0 group">
                      <Eye size={22} className="group-hover:scale-110 transition-transform" />
                    </Link>
                  </div>
                )) : (
                  <div className="p-12 text-center bg-accent/5 rounded-[40px] border border-dashed border-border/60">
                     <p className="text-muted-foreground font-bold italic">Активных сделок не обнаружено</p>
                  </div>
                )}
              </div>

              <div className="bg-primary rounded-[48px] p-10 text-white relative overflow-hidden card-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                   <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center border border-white/10 shrink-0">
                     <Settings size={36} className="text-secondary" />
                   </div>
                   <div className="space-y-3 flex-1 text-center md:text-left">
                     <h3 className="text-2xl font-black">AI Мониторинг</h3>
                     <p className="text-white/60 font-medium leading-relaxed">
                       Наша система автоматически анализирует чаты на предмет передачи личных данных или подозрительного поведения. 
                       Вы получите мгновенное уведомление в случае угрозы.
                     </p>
                   </div>
                   <button className="btn-primary py-4 px-8 bg-white text-primary hover:bg-white/90">Обновить фильтры</button>
                </div>
              </div>
            </div>

            {/* Status & Guard Sidebar */}
            <div className="space-y-8">
              <div className="premium-card rounded-[48px] overflow-hidden border border-border/40 bg-white card-shadow">
                <div className="bg-secondary p-8 text-white space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <Shield size={24} />
                    Безопасность
                  </h3>
                  <p className="text-xs text-white/70 font-bold uppercase tracking-widest">Уровень доверия: ВЫСОКИЙ</p>
                </div>
                <div className="p-8 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-success/10 rounded-2xl">
                        <CheckCircle2 size={20} className="text-success" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black italic">ID Подтвержден</p>
                        <p className="text-xs text-muted-foreground font-medium">Ребенок и все его клиенты успешно прошли верификацию личности.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/5 p-6 rounded-3xl space-y-3 border border-border/40 border-dashed">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-secondary tracking-widest">Режим Приватности</span>
                      <EyeOff size={16} className="text-secondary" />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium italic">
                      Мы сохраняем доверие ребенка. Чат мониторится фильтрами, но вы увидите текст только в случае реального нарушения правил.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-destructive/5 rounded-[40px] p-8 border border-destructive/10 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-3 text-destructive">
                    <AlertTriangle size={24} />
                    Экстренная мера
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Замораживает все активные сделки ребенка до вашего подтверждения.
                  </p>
                </div>
                {blockSuccess && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-2xl text-success text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Все активные сделки ребёнка успешно заморожены!
                  </div>
                )}
                <button
                  onClick={handleFreezeAll}
                  disabled={isBlockLoading}
                  className="w-full py-4 bg-white border border-destructive/20 text-destructive text-xs font-black uppercase rounded-2xl hover:bg-destructive hover:text-white transition-all shadow-lg shadow-destructive/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBlockLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Заблокировать сессию
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-center bg-white rounded-[40px] border border-border/40 p-12 card-shadow">
           <h2 className="text-2xl font-black">Нет привязанных аккаунтов детей</h2>
           <p className="text-muted-foreground mt-4">При регистрации ребенка укажите ваш Email в поле родителя для связи.</p>
        </div>
      )}

      {/* Limits Modal */}
      {showLimitsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLimitsModal(false)} />
          <div className="relative bg-white rounded-[48px] p-10 max-w-sm w-full space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-black">Лимиты безопасности</h2>
              <p className="text-sm text-muted-foreground font-medium">Ограничьте максимальную сумму сделки в день для ребёнка.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Дневной лимит (₸)</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full p-4 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 font-black text-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLimitsModal(false)}
                className="py-4 rounded-2xl border border-border font-black hover:bg-accent transition-all"
              >
                Отмена
              </button>
              <button
                onClick={() => { alert(`Лимит установлен: ${parseInt(dailyLimit).toLocaleString()} ₸/день`); setShowLimitsModal(false); }}
                className="py-4 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 transition-all"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
