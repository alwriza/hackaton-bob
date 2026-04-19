'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ArrowRight, Star, TrendingUp, 
  CheckCircle2, Users, CreditCard, UserCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingServices = async () => {
      try {
        const { data } = await supabase
          .from('services')
          .select('id, owner_id, title, description, price, category, image, rating, created_at, profiles(name, avatar)')
          .limit(3);
        
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching trending services:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingServices();
  }, []);

  return (
    <div className="space-y-24 pb-20 overflow-x-hidden animate-in fade-in duration-1000">
      {/* 
        Hero Section - Split Screen Layout
      */}
      <section className="relative pt-12 md:pt-20">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column: Copy & CTAs */}
            <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="inline-flex items-center gap-3 bg-secondary/10 text-secondary px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-secondary/20 shadow-sm">
                <ShieldCheck size={16} strokeWidth={3} />
                Безопасная сделка (Escrow)
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
                Биржа фриланса для <span className="text-secondary">подростков</span>. 
                <br />
                <span className="text-muted-foreground/60">Безопасно. Полезно. Твое.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                Первая платформа, где опыт важнее возраста. 
                Зарабатывай на своих талантах под надежной защитой родителей и нашей системы доверия.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register" className="btn-primary py-5 px-10 text-lg flex items-center justify-center gap-2 group">
                  Стать исполнителем
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/browse" className="btn-secondary py-5 px-10 text-lg flex items-center justify-center gap-2">
                  Найти работу
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4 grayscale opacity-70 border-t border-border/40 w-fit pr-10">
                <div className="flex flex-col">
                  <span className="text-2xl font-black uppercase tracking-tighter">500+</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Исполнителей</span>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black uppercase tracking-tighter">100%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Безопасность</span>
                </div>
              </div>
            </div>

            {/* Right Column: Modern Illustration */}
            <div className="relative lg:h-[600px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000 delay-200">
              <div className="absolute inset-0 bg-primary/5 rounded-[60px] blur-3xl rotate-3"></div>
              <div className="relative w-full h-full max-w-xl lg:max-w-none rounded-[48px] overflow-hidden border border-border/40 shadow-premium">
                <img 
                  src="/hero_teen_collaboration_1776537742281.png" 
                  alt="Teen collaboration" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 bg-white p-5 rounded-[32px] card-shadow border border-border/50 animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center text-success">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Репутация</p>
                    <p className="text-base font-black tracking-tight">+15 XP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        "С чего начать?" Section
      */}
      <section className="container mx-auto px-4 lg:px-6 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="w-12 h-1.5 bg-accent rounded-full"></div>
            <h2 className="text-4xl font-black tracking-tight">С чего начать?</h2>
            <p className="text-xl text-muted-foreground font-medium">Трендовые услуги, на которых подростки зарабатывают уже сегодня.</p>
          </div>
          <Link href="/browse" className="group flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest">
            Весь каталог
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[1/1.2] bg-slate-50 rounded-[40px] animate-pulse border border-border/40"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`} className="premium-card rounded-[40px] flex flex-col group h-full transition-all">
                <div className="aspect-[1.4/1] relative overflow-hidden p-3 pb-0">
                  <img 
                    src={service.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'} 
                    alt={service.title} 
                    className="w-full h-full object-cover rounded-[32px] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm border border-primary/10">
                    {service.category}
                  </div>
                </div>
                
                <div className="p-8 pt-6 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-accent/10 border border-border flex items-center justify-center overflow-hidden">
                         {service.profiles?.avatar ? (
                           <img src={service.profiles.avatar} className="w-full h-full object-cover" />
                         ) : (
                           <UserCircle size={14} className="text-muted-foreground" />
                         )}
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {service.profiles?.name || 'Пользователь'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black leading-tight tracking-tight">
                      {service.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border/40 mt-auto">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Цена от</span>
                       <span className="text-2xl font-black text-primary">
                         {service.price.toLocaleString()}<span className="text-sm ml-1 font-bold tracking-normal">₸</span>
                       </span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-warning/10 px-3 py-1.5 rounded-xl">
                       <Star size={14} className="fill-warning text-warning" />
                       <span className="text-sm font-black text-warning leading-none">{service.rating || '5.0'}</span>
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 
        Feature Blocks: "Safe Payment" & "Trust Score" 
      */}
      <section className="container mx-auto px-4 lg:px-6">
        <div className="bg-primary rounded-[64px] p-8 md:p-16 lg:p-24 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary/10 to-transparent"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight italic">Твоя безопасность — наш приоритет.</h2>
              
              <div className="space-y-8">
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                    <CreditCard size={32} className="text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black">Защищенная оплата</h4>
                    <p className="text-white/60 font-medium leading-relaxed">Система эскроу удерживает средства до подтверждения результата. Прямые выплаты на карту Казахстана.</p>
                  </div>
                </div>
                
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                    <Users size={32} className="text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black">Родительский контроль</h4>
                    <p className="text-white/60 font-medium leading-relaxed">Прозрачный мониторинг доходов и сделок через привязанный аккаунт родителя.</p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                    <CheckCircle2 size={32} className="text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black">Trust Score</h4>
                    <p className="text-white/60 font-medium leading-relaxed">Расти профессионально. Каждый отзыв повышает твой рейтинг и доступ к VIP-заказам.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] lg:h-[500px] w-full hidden lg:block">
              <div className="absolute inset-0 bg-white/5 rounded-[64px] border border-white/10 backdrop-blur-xl p-12 flex flex-col justify-center space-y-10">
                 <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-success border border-success/20">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="w-1/2 h-3 bg-white/20 rounded-full"></div>
                        <div className="w-1/3 h-2 bg-white/10 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 leading-none">Оплата</p>
                        <p className="text-2xl font-black tracking-tighter text-white">ВЫПЛАЧЕНО</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 leading-none">Репутация</p>
                        <p className="text-2xl font-black tracking-tighter text-white">+10 XP</p>
                      </div>
                    </div>
                    <div className="bg-secondary/20 p-8 rounded-[40px] border border-secondary/30 text-center space-y-4">
                      <ShieldCheck size={56} className="mx-auto text-secondary" />
                      <p className="text-sm font-black uppercase tracking-widest text-secondary">Protected by OPENwork Protocol</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bottom */}
      <section className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-60 hover:opacity-100 transition-all duration-700">
           {[
             { label: 'Safe Payments', icon: ShieldCheck },
             { label: 'Teen Hub', icon: Users },
             { label: 'Verified Exp', icon: TrendingUp }
           ].map((stat, i) => (
             <div key={i} className="flex items-center gap-4 group">
               <div className="w-14 h-14 bg-slate-50 border border-border/40 rounded-full flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                 <stat.icon size={24} className="text-primary" />
               </div>
               <p className="text-sm font-black uppercase tracking-widest text-foreground">{stat.label}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
