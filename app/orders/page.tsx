'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, MessageSquare, ChevronRight, ShoppingBag, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, services(*), profiles:seller_id(*)')
          .eq('buyer_id', user.id);

        if (error) {
          console.error('Error fetching orders:', error);
        } else {
          setOrders(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 size={64} className="animate-spin text-primary" />
        <p className="text-xl font-black text-muted-foreground animate-pulse tracking-wide uppercase">Загружаем ваши покупки...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Мои покупки</h1>
        <p className="text-muted-foreground">Здесь отображаются все заказы, которые вы оплатили через эскроу.</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((t) => {
            const service = t.services;
            const seller = t.profiles;
            
            return (
              <Link 
                key={t.id} 
                href={`/transaction/${t.id}`}
                className="block bg-white border border-border rounded-3xl p-6 transition-all hover:shadow-xl hover:border-primary/20 group animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-32 h-24 rounded-2xl bg-accent overflow-hidden shrink-0">
                    <img src={service?.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'} alt={service?.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{service?.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-accent overflow-hidden">
                            {seller?.avatar ? (
                               <img src={seller.avatar} alt={seller.name} />
                            ) : (
                               <div className="w-full h-full bg-primary/10 flex items-center justify-center text-[8px]">{seller?.name?.[0]}</div>
                            )}
                          </div>
                          <span className="font-medium text-foreground">Исполнитель: {seller?.name || 'Пользователь'}</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-wider">
                        <ShieldCheck size={12} />
                        {t.status === 'ACTIVE' ? 'Оплачено (Escrow)' : t.status}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Прогресс</span>
                        <span>{t.status}</span>
                      </div>
                      <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: t.status === 'COMPLETED' ? '100%' : '50%' }}></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-accent/50 p-3 rounded-2xl text-sm border border-border/50">
                      <MessageSquare size={16} className="text-primary shrink-0" />
                      <p className="truncate italic text-muted-foreground">Нажмите, чтобы открыть чат с исполнителем</p>
                      <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-8 bg-white rounded-[48px] border border-border/60 p-12 card-shadow animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-64 h-64 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl"></div>
            <img 
              src="/empty_state_toolkit_1776537754872.png" 
              alt="No orders yet" 
              className="relative z-10 w-full h-full object-contain"
            />
          </div>
          <div className="space-y-3 max-w-sm mx-auto">
            <h3 className="text-2xl font-black italic">Пока нет покупок?</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Найдите первую крутую услугу в каталоге и начните свой путь к успеху с защитой эскроу!
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => router.push('/browse')}
              className="btn-primary py-5 px-10 shadow-xl shadow-accent/20 flex items-center gap-3 group"
            >
              <Search size={22} className="group-hover:rotate-12 transition-transform" />
              Перейти в каталог
            </button>
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
              Как работает безопасная оплата?
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
