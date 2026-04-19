'use client';
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Service, User } from '@/lib/types';
import { 
  ShieldCheck, Calendar, Clock, Star, ArrowLeft, 
  Send, CheckCircle2, UserCircle, Shield, CreditCard, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, owner_id, title, description, price, category, image, rating, reviews_count, created_at, profiles(*)')
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching service:', error);
        } else {
          setService(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) fetchService();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 size={64} className="animate-spin text-primary" />
        <p className="text-xl font-black text-muted-foreground animate-pulse tracking-wide uppercase">Загружаем детали...</p>
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

  const handleOrder = () => {
    router.push(`/transaction/new?serviceId=${service.id}`);
  };

  const owner = service.profiles;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-all font-black text-sm uppercase tracking-widest group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Назад в каталог
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-secondary/10 rounded-2xl text-[10px] font-black text-secondary uppercase tracking-widest border border-secondary/10">
              <ShieldCheck size={14} strokeWidth={3} />
              {service.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-foreground tracking-tight">
              {service.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent/5 border border-border/40 overflow-hidden shadow-sm">
                  {owner?.avatar ? (
                    <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={48} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black leading-tight">{owner?.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Траст: {owner?.trust_score}%</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border/60 hidden sm:block"></div>
              <div className="flex items-center gap-2 bg-warning/5 px-4 py-2 rounded-2xl border border-warning/10">
                <Star size={18} className="fill-warning text-warning" />
                <span className="text-base font-black text-foreground">{service.rating || '5.0'}</span>
                <span className="text-xs font-bold text-muted-foreground ml-1">({service.reviews_count || 0} отзывов)</span>
              </div>
            </div>
          </div>

          <div className="aspect-video rounded-[48px] overflow-hidden bg-slate-50 border border-border/40 shadow-premium group">
            <img 
              src={service.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'} 
              alt={service.title} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
            />
          </div>

          <div className="space-y-6 bg-white rounded-[40px] p-8 border border-border/40">
            <h2 className="text-2xl font-black italic flex items-center gap-3">
              <div className="w-1.5 h-8 bg-accent rounded-full"></div>
              Описание услуги
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
              {service.description}
            </p>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full"></div>
              Этапы выполнения заказа
            </h2>
            <div className="space-y-4">
              {Array.isArray(service.milestones) ? service.milestones.map((ms: any, index: number) => (
                <div key={index} className="flex gap-6 p-6 rounded-[32px] bg-white border border-border/60 shadow-soft hover:shadow-premium transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary shrink-0 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1 py-1">
                    <h3 className="text-lg font-black">{ms.title}</h3>
                    <p className="text-sm font-bold text-secondary">
                      Стоимость этапа: {ms.amount.toLocaleString()} ₸
                    </p>
                  </div>
                  <div className="self-center p-2 bg-success/10 text-success rounded-xl">
                    <CheckCircle2 size={20} strokeWidth={3} />
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground italic p-4">Этапы выполнения не указаны.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Order Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <div className="bg-white rounded-[48px] p-10 border border-border/60 shadow-premium space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Стоимость услуги</p>
                <div className="flex items-end gap-1">
                   <span className="text-5xl font-black tracking-tighter text-primary">{service.price.toLocaleString()}</span>
                   <span className="text-xl font-black text-muted-foreground/60 mb-2">₸</span>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-3 text-sm text-foreground font-bold">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Clock size={18} />
                  </div>
                  Срок: 3-5 рабочих дней
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-bold">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Send size={18} />
                  </div>
                  Сдача: Ссылка / Файл
                </div>
                <div className="flex items-center gap-3 text-sm text-success font-black uppercase tracking-wider bg-success/5 p-4 rounded-2xl border border-success/10">
                  <Shield size={20} strokeWidth={2.5} />
                  Safe Escrow Protected
                </div>
              </div>

              <button 
                onClick={handleOrder}
                className="w-full btn-primary py-6 text-xl shadow-2xl shadow-accent/40"
              >
                Заказать сейчас
              </button>

              <div className="flex items-center gap-3 justify-center pt-2">
                 <CreditCard size={16} className="text-muted-foreground" />
                 <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest leading-tight">
                   Безопасная оплата картой
                 </p>
              </div>
            </div>

            <div className="bg-primary rounded-[40px] p-8 text-white space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
               <h3 className="text-xl font-black flex items-center gap-3">
                 <ShieldCheck size={24} className="text-secondary" />
                 OpenWork Security
               </h3>
               <ul className="space-y-4">
                 {[
                   'Деньги хранятся в эскроу-сейфе',
                   'Оплата только за готовый результат',
                   'Помощь арбитража при любых спорах',
                   'Верифицированные исполнители'
                 ].map((item, i) => (
                   <li key={i} className="flex gap-3 text-xs font-bold text-white/70">
                     <span className="text-secondary">•</span>
                     {item}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
