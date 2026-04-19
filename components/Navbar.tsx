'use client';

import Link from 'next/link';
import {
  ShieldCheck, Bell, User as UserIcon, LogOut,
  ChevronDown, LayoutGrid, ShoppingBag, Briefcase,
  UserCircle, Settings, Star, MessageSquare,
  CheckCircle2, AlertTriangle, X, Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'message' | 'transaction' | 'alert';
  title: string;
  body: string;
  href: string;
  time: string;
  read: boolean;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications from real transactions + messages
  useEffect(() => {
    if (!user) { setNotifications([]); return; }

    const fetchNotifications = async () => {
      const items: Notification[] = [];

      // Recent transactions as buyer
      const { data: buyerTx } = await supabase
        .from('transactions')
        .select('id, status, created_at, services(title)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      (buyerTx || []).forEach((tx: any) => {
        const statusMap: Record<string, { title: string; body: string; type: Notification['type'] }> = {
          ACTIVE:    { type: 'transaction', title: 'Сделка открыта', body: `Ваш заказ "${tx.services?.title}" запущен. Средства в эскроу.` },
          COMPLETED: { type: 'transaction', title: 'Сделка завершена ✅', body: `"${tx.services?.title}" — оплата выплачена исполнителю.` },
          FROZEN:    { type: 'alert',       title: 'Сделка заморожена 🚨', body: `"${tx.services?.title}" была заморожена.` },
          DISPUTED:  { type: 'alert',       title: 'Открыт спор ⚖️',  body: `По заказу "${tx.services?.title}" открыт спор.` },
        };
        const info = statusMap[tx.status] || statusMap.ACTIVE;
        items.push({
          id: `tx-${tx.id}`,
          type: info.type,
          title: info.title,
          body: info.body,
          href: `/transaction/${tx.id}`,
          time: tx.created_at,
          read: false,
        });
      });

      // Recent transactions as seller
      const { data: sellerTx } = await supabase
        .from('transactions')
        .select('id, status, created_at, services(title)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      (sellerTx || []).forEach((tx: any) => {
        if (tx.status === 'ACTIVE') {
          items.push({
            id: `sell-${tx.id}`,
            type: 'message',
            title: 'Новый заказ на вашу услугу',
            body: `Кто-то заказал "${tx.services?.title}". Начните общение!`,
            href: `/transaction/${tx.id}`,
            time: tx.created_at,
            read: false,
          });
        }
        if (tx.status === 'COMPLETED') {
          items.push({
            id: `sell-done-${tx.id}`,
            type: 'transaction',
            title: 'Оплата получена ✅',
            body: `Заказчик подтвердил работу по "${tx.services?.title}".`,
            href: `/transaction/${tx.id}`,
            time: tx.created_at,
            read: false,
          });
        }
      });

      // If user is a PARENT, fetch parent_alerts
      if (user.role === 'PARENT') {
        const { data: parentAlerts } = await supabase
          .from('parent_alerts')
          .select('*, child:child_id(name)')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        (parentAlerts || []).forEach((alert: any) => {
          items.push({
            id: `alert-${alert.id}`,
            type: 'alert',
            title: `Тревога: ${alert.type}`,
            body: alert.message + ` (Ребёнок: ${alert.child?.name})`,
            href: alert.transaction_id ? `/transaction/${alert.transaction_id}` : '/parent',
            time: alert.created_at,
            read: false,
          });
        });
      }

      // Sort by time
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items.slice(0, 6));
    };

    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setShowNotifications(false);
    router.push(notif.href);
  };

  const getNotifIcon = (type: Notification['type']) => {
    if (type === 'message')     return <MessageSquare size={16} className="text-primary" />;
    if (type === 'alert')       return <AlertTriangle size={16} className="text-destructive" />;
    return <CheckCircle2 size={16} className="text-success" />;
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'только что';
    if (m < 60) return `${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч назад`;
    return `${Math.floor(h / 24)} дн назад`;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group transition-all shrink-0">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            O
          </div>
          <span className="text-2xl font-black tracking-tight text-foreground hidden sm:inline">
            OPEN<span className="text-secondary">work</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/browse"
            className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all ${
              pathname === '/browse' ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
            }`}
          >
            <LayoutGrid size={18} />
            Каталог
          </Link>

          {user && (
            <>
              <Link
                href="/orders"
                className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all ${
                  pathname === '/orders' ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }`}
              >
                <ShoppingBag size={18} />
                Покупки
              </Link>
              <Link
                href="/my-services"
                className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all ${
                  pathname === '/my-services' ? 'bg-secondary/5 text-secondary' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }`}
              >
                <Briefcase size={18} />
                Мои услуги
              </Link>
            </>
          )}

          <Link
            href="/parent"
            className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all ${
              pathname === '/parent' ? 'bg-secondary/5 text-secondary' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
            }`}
          >
            <ShieldCheck size={18} />
            Опека
          </Link>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* ── Notifications Bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(prev => !prev); setShowProfileMenu(false); }}
              className={`p-2.5 relative rounded-xl transition-all duration-200 ${
                showNotifications
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-accent/10 text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Bell size={22} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-14 right-0 w-80 bg-white border border-border/50 rounded-3xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <span className="text-sm font-black">Уведомления</span>
                    {unreadCount > 0 && (
                      <span className="bg-destructive/10 text-destructive text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unreadCount} новых
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                      >
                        Прочитать все
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-accent rounded-lg transition-all">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <Bell size={32} className="text-muted-foreground/30 mx-auto" />
                      <p className="text-sm font-bold text-muted-foreground">Нет уведомлений</p>
                      <p className="text-xs text-muted-foreground/70">
                        {user ? 'Создайте или закажите услугу чтобы получать обновления' : 'Войдите чтобы видеть уведомления'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-5 py-4 flex items-start gap-3.5 hover:bg-slate-50 transition-all border-b border-border/20 last:border-none ${
                          !notif.read ? 'bg-primary/[0.02]' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.type === 'alert'       ? 'bg-destructive/10' :
                          notif.type === 'message'     ? 'bg-primary/10' :
                          'bg-success/10'
                        }`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-black truncate ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                            {notif.body}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 font-bold flex items-center gap-1">
                            <Clock size={10} />
                            {timeAgo(notif.time)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-border/40 bg-slate-50/50">
                    <Link
                      href="/orders"
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest flex items-center justify-center gap-1"
                    >
                      Все мои сделки →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Profile Menu ── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-3 p-1.5 pl-2 pr-2.5 rounded-2xl bg-white border border-border/60 hover:border-primary/20 transition-all card-shadow"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white shadow-sm shrink-0 bg-accent/20 flex items-center justify-center font-black text-primary">
                {user ? (
                  user.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    : <span className="text-sm">{user.name?.[0]?.toUpperCase()}</span>
                ) : (
                  <UserIcon size={18} className="text-muted-foreground" />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none pr-1">
                <span className="text-xs font-black text-foreground">{user ? user.name : 'Войти'}</span>
                {user && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={10} className="text-warning fill-warning" />
                    <span className="text-[10px] font-bold text-muted-foreground">{user.trust_score} Trust</span>
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute top-14 right-0 bg-white border border-border/50 rounded-3xl card-shadow p-3 w-64 z-[60] animate-in fade-in zoom-in-95 duration-200">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-accent/5 rounded-2xl mb-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black">{user.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Траст: {user.trust_score}%</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3.5 hover:bg-accent/10 transition-all mb-1"
                    >
                      <UserCircle size={20} className="text-muted-foreground" />
                      <span>Мой профиль</span>
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3.5 hover:bg-accent/10 transition-all mb-1"
                    >
                      <ShoppingBag size={20} className="text-muted-foreground" />
                      <span>Мои покупки</span>
                    </Link>
                    <Link
                      href="/my-services"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3.5 hover:bg-accent/10 transition-all mb-1"
                    >
                      <Briefcase size={20} className="text-muted-foreground" />
                      <span>Мои услуги</span>
                    </Link>
                    <div className="h-px bg-border/50 my-2 mx-2" />
                    <button
                      onClick={() => { logout(); setShowProfileMenu(false); }}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-destructive flex items-center gap-3.5 hover:bg-destructive/5 transition-all"
                    >
                      <LogOut size={20} />
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 p-1">
                    <Link
                      href="/login"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black text-center block shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                      Войти в систему
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full py-3 border border-border rounded-2xl font-black text-center block hover:bg-accent/5 transition-all text-sm"
                    >
                      Создать аккаунт
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
