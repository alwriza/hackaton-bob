'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User as UserIcon, Mail, ShieldCheck, Award,
  Settings, LogOut, ChevronRight, Briefcase, Star, Heart, Plus, ExternalLink, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [myServices, setMyServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMyServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('id, title, price, rating, category, image')
        .eq('owner_id', user.id);
      setMyServices(data || []);
      setIsLoading(false);
    };
    fetchMyServices();
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Profile Header */}
      <section className="bg-white rounded-[40px] p-8 border border-border card-shadow flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />

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
            <div className="px-4 py-1.5 bg-white border border-border rounded-full text-xs font-bold text-muted-foreground flex items-center gap-2">
              <Briefcase size={14} />
              {user.completed_jobs || 0} сделок
            </div>
            <div className="px-4 py-1.5 bg-primary/5 rounded-full text-xs font-bold text-primary flex items-center gap-2 border border-primary/10">
              Баланс: {(user.balance || 0).toLocaleString()} ₸
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl font-medium transition-all active:scale-95 bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-2 text-sm font-bold"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </section>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Мои заказы', href: '/orders', icon: ShieldCheck, color: 'text-primary' },
          { label: 'Мои услуги', href: '/my-services', icon: Briefcase, color: 'text-success' },
          { label: 'Каталог', href: '/browse', icon: Heart, color: 'text-warning' },
          { label: 'Создать услугу', href: '/create', icon: Plus, color: 'text-secondary' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-[28px] p-6 border border-border hover:shadow-lg hover:border-primary/20 transition-all group flex flex-col items-center gap-3 text-center"
          >
            <div className={`p-3 bg-accent/50 rounded-2xl group-hover:bg-primary/10 transition-all ${item.color}`}>
              <item.icon size={24} />
            </div>
            <span className="text-sm font-black text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* My Active Services */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Мои услуги</h2>
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
                className="bg-white border border-border rounded-3xl p-4 flex gap-4 transition-all hover:shadow-lg hover:border-primary/20 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent overflow-hidden shrink-0">
                  <img
                    src={service.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-black group-hover:text-primary transition-colors">{service.title}</h3>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-black text-primary">{service.price.toLocaleString()} ₸</p>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{service.category}</span>
                    {service.rating && (
                      <div className="flex items-center gap-1 text-warning">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-bold text-foreground">{service.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ExternalLink size={18} className="self-center text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-white rounded-3xl border border-border border-dashed text-center space-y-3">
            <p className="text-sm text-muted-foreground font-medium">У вас пока нет активных услуг.</p>
            <Link href="/create" className="text-primary font-bold text-sm hover:underline">
              Предложите свои услуги сейчас →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
