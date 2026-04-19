'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, MessageSquare, ChevronRight, Briefcase, Plus, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch active sales
        const { data: salesData, error: salesError } = await supabase
          .from('transactions')
          .select('*, services(*), profiles:buyer_id(*)')
          .eq('seller_id', user.id);

        // Fetch my services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('owner_id', user.id);

        if (salesError) console.error('Error fetching sales:', salesError);
        else setSales(salesData || []);

        if (servicesError) console.error('Error fetching services:', servicesError);
        else setMyServices(servicesData || []);

      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 size={64} className="animate-spin text-secondary" />
        <p className="text-xl font-black text-muted-foreground animate-pulse tracking-wide uppercase">Загружаем ваши услуги...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black">Мои услуги</h1>
          <p className="text-muted-foreground font-medium">Управляйте вашими предложениями и активными заказами.</p>
        </div>
        <Link href="/create" className="px-6 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 border-none">
          <Plus size={22} />
          Создать услугу
        </Link>
      </div>

      {/* Section: Active Work */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
          Заказы в работе
        </h2>

        {sales.length > 0 ? (
          <div className="space-y-4">
            {sales.map((t) => {
              const service = t.services;
              const buyer = t.profiles;
              
              return (
                <Link 
                  key={t.id} 
                  href={`/transaction/${t.id}`}
                  className="block bg-white border border-border rounded-[32px] p-8 transition-all hover:shadow-xl hover:border-primary/20 group card-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-32 h-24 rounded-2xl bg-accent overflow-hidden shrink-0 border border-border/40">
                      <img src={service?.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'} alt={service?.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 space-y-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-black text-xl group-hover:text-primary transition-colors leading-tight">{service?.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                            <div className="w-6 h-6 rounded-lg bg-accent/20 overflow-hidden border border-white shadow-sm">
                              {buyer?.avatar ? <img src={buyer.avatar} alt={buyer.name} /> : <div className="w-full h-full bg-primary/5"></div>}
                            </div>
                            <span className="font-bold text-foreground/80">Заказчик: {buyer?.name || 'Пользователь'}</span>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/10">
                          <ShieldCheck size={14} />
                          {t.status === 'ACTIVE' ? 'Средства в эскроу' : t.status}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>Прогресс выполнения</span>
                          <span>Статус: {t.status}</span>
                        </div>
                        <div className="w-full h-2.5 bg-accent/30 rounded-full overflow-hidden p-0.5 border border-border/40">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-sm" style={{ width: t.status === 'COMPLETED' ? '100%' : '50%' }}></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-accent/10 p-4 rounded-2xl text-sm border border-border/20">
                        <MessageSquare size={18} className="text-primary shrink-0" />
                        <p className="truncate italic text-muted-foreground font-medium">Нажмите, чтобы открыть чат с заказчиком</p>
                        <ChevronRight size={18} className="ml-auto text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center bg-white rounded-[40px] border border-dashed border-border/60 p-10 card-shadow">
            <p className="text-muted-foreground font-bold italic">Пока нет активных заказов на ваши услуги.</p>
          </div>
        )}
      </section>

      {/* Section: My Published Services */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <div className="w-1.5 h-8 bg-secondary rounded-full"></div>
          Ваши услуги на витрине
        </h2>
        {myServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myServices.map((s) => (
              <div key={s.id} className="bg-white border border-border/60 rounded-[32px] overflow-hidden flex gap-6 p-5 hover:shadow-xl hover:border-secondary/20 transition-all card-shadow group">
                <div className="w-24 h-24 rounded-[22px] bg-accent/10 overflow-hidden shrink-0 border border-border/40">
                  <img src={s.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 space-y-3 flex flex-col justify-center">
                  <h3 className="font-black text-lg leading-tight group-hover:text-secondary transition-colors line-clamp-2">{s.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-black text-secondary">{s.price.toLocaleString()} ₸</span>
                    <div className="flex items-center gap-1.5 bg-warning/5 px-3 py-1 rounded-xl border border-warning/10">
                      <Star size={14} className="text-warning fill-warning" />
                      <span className="text-sm font-black text-warning">{s.rating || '5.0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-8 bg-white rounded-[48px] border border-border/60 p-12 card-shadow animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-64 h-64 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="absolute inset-0 bg-secondary/5 rounded-full blur-3xl text-secondary"></div>
              <img 
                src="/empty_state_toolkit_1776537754872.png" 
                alt="No services yet" 
                className="relative z-10 w-full h-full object-contain"
              />
            </div>
            <div className="space-y-3 max-w-sm mx-auto">
              <h3 className="text-2xl font-black italic">Готовы начать зарабатывать?</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Создайте свою первую услугу и откройте мир новых возможностей. Это проще, чем кажется!
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/create"
                className="btn-primary py-5 px-10 shadow-xl shadow-secondary/20 flex items-center gap-3 group bg-secondary hover:bg-secondary/90 border-none"
              >
                <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                Создать новую услугу
              </Link>
              <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-secondary transition-colors">
                Как правильно оформить услугу?
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
