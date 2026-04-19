'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, ArrowLeft, Loader2, CreditCard, CheckCircle2, Lock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function NewTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const serviceId = searchParams.get('serviceId');

  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      router.push('/browse');
      return;
    }
    const fetchService = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, profiles(*)')
        .eq('id', serviceId)
        .single();
      if (error || !data) {
        setError('Услуга не найдена.');
      } else {
        setService(data);
      }
      setIsLoading(false);
    };
    fetchService();
  }, [serviceId, router]);

  const handleConfirmOrder = async () => {
    if (!user || !service) return;
    if (user.id === service.owner_id) {
      setError('Вы не можете заказать собственную услугу.');
      return;
    }

    setIsOrdering(true);
    setError(null);
    try {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          service_id: service.id,
          buyer_id: user.id,
          seller_id: service.owner_id,
          amount: service.price,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (txError) throw txError;

      router.push(`/transaction/${tx.id}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании заказа. Попробуйте ещё раз.');
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 size={64} className="animate-spin text-primary" />
        <p className="text-xl font-black text-muted-foreground animate-pulse tracking-wide uppercase">Загрузка...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-2xl font-black">Услуга не найдена</h2>
        <Link href="/browse" className="text-primary font-bold hover:underline">Вернуться в каталог</Link>
      </div>
    );
  }

  const seller = service.profiles;
  const milestones = Array.isArray(service.milestones) ? service.milestones : [];

  return (
    <div className="max-w-xl mx-auto pb-24 space-y-10 animate-in fade-in duration-700">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-all font-black text-sm uppercase tracking-widest group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Назад
      </button>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Оформление заказа</p>
        <h1 className="text-4xl font-black tracking-tight">Подтверждение</h1>
        <p className="text-muted-foreground font-medium">Проверьте детали перед тем, как открыть сделку.</p>
      </div>

      {/* Service card */}
      <div className="bg-white rounded-[40px] p-8 border border-border space-y-6 card-shadow">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Услуга</p>
          <h2 className="text-2xl font-black">{service.title}</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">{service.description}</p>
        </div>

        <div className="flex items-center gap-3 border-t border-border/40 pt-6">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-border/40 overflow-hidden flex items-center justify-center font-black text-sm">
            {seller?.avatar ? <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" /> : seller?.name?.[0] || '?'}
          </div>
          <div>
            <p className="font-black text-sm">{seller?.name || 'Исполнитель'}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Траст: {seller?.trust_score || 100}%</p>
          </div>
        </div>
      </div>

      {/* Milestone breakdown */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-[40px] p-8 border border-border space-y-4 card-shadow">
          <h3 className="text-lg font-black flex items-center gap-2">
            <div className="w-1.5 h-6 bg-success rounded-full" />
            Этапы оплаты
          </h3>
          {milestones.map((ms: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-black flex items-center justify-center">{i + 1}</div>
                <span className="font-bold text-sm">{ms.title}</span>
              </div>
              <span className="font-black text-primary">{parseInt(ms.amount || 0).toLocaleString()} ₸</span>
            </div>
          ))}
        </div>
      )}

      {/* Escrow total */}
      <div className="bg-primary rounded-[40px] p-8 text-white space-y-4">
        <div className="flex items-center gap-3">
          <Lock size={24} className="text-white/60" />
          <p className="font-black uppercase tracking-widest text-sm">Эскроу-холдирование</p>
        </div>
        <p className="text-white/70 text-sm leading-relaxed font-medium">
          Средства будут заморожены на платформе и поступят исполнителю только после вашего подтверждения результата.
        </p>
        <div className="flex items-end justify-between pt-2 border-t border-white/20">
          <span className="text-white/60 font-bold text-sm">Итого к холдированию</span>
          <span className="text-4xl font-black">{service.price.toLocaleString()} ₸</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex items-center gap-3 text-destructive text-sm font-bold animate-in slide-in-from-top-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {!user ? (
        <Link href="/login" className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3">
          Войдите для оформления заказа
        </Link>
      ) : (
        <button
          onClick={handleConfirmOrder}
          disabled={isOrdering}
          className="w-full btn-primary py-6 text-xl shadow-2xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-4 group"
        >
          {isOrdering ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <ShieldCheck size={24} />
              Открыть сделку и войти в чат
            </>
          )}
        </button>
      )}

      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium">
        <CheckCircle2 size={14} className="text-success" />
        Защищено системой эскроу OPENwork
      </div>
    </div>
  );
}
