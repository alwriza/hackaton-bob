'use client';

import Link from 'next/link';
import { 
  ShieldCheck, Bell, User as UserIcon, LogOut, 
  ChevronDown, LayoutGrid, ShoppingBag, Briefcase, 
  UserCircle, Settings, HelpCircle, Star
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MOCK_USERS } from '@/lib/mock-data';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group transition-all shrink-0">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            O
          </div>
          <span className="text-2xl font-black tracking-tight text-foreground hidden sm:inline">
            OPEN<span className="text-secondary">work</span>
          </span>
        </Link>

        {/* Desktop Nav - Core Hub */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link 
            href="/browse" 
            className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all ${
              pathname === '/browse' 
                ? 'bg-primary/5 text-primary' 
                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
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
                  pathname === '/orders' 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }`}
              >
                <ShoppingBag size={18} />
                Покупки
              </Link>
              <Link 
                href="/my-services" 
                className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all ${
                  pathname === '/my-services' 
                    ? 'bg-secondary/5 text-secondary' 
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
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
              pathname === '/parent' 
                ? 'bg-secondary/5 text-secondary' 
                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
            }`}
          >
            <ShieldCheck size={18} />
            Опека
          </Link>
        </nav>

        <div className="flex items-center gap-3 sm:gap-6">
          <button className="p-2.5 text-muted-foreground hover:text-primary transition-colors relative bg-accent/10 rounded-xl">
            <Bell size={22} strokeWidth={2.5} />
            {user && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white shadow-sm"></span>}
          </button>

          {/* User Account / Profile Consolidated */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-1.5 pl-2 pr-2.5 rounded-2xl bg-white border border-border/60 hover:border-primary/20 transition-all card-shadow"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white shadow-sm shrink-0">
                {user ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-full h-full p-2 text-muted-foreground bg-accent/20" />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none pr-1">
                <span className="text-xs font-black text-foreground">
                  {user ? user.name : 'Войти'}
                </span>
                {user && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={10} className="text-warning fill-warning" />
                    <span className="text-[10px] font-bold text-muted-foreground">{user.trust_score} Trust</span>
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute top-14 right-0 bg-white border border-border/50 rounded-3xl card-shadow p-3 w-64 z-[60] animate-in fade-in zoom-in-95 duration-200">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-accent/5 rounded-2xl mb-2 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                         {user.name[0]}
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
                      href="/settings" 
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3.5 hover:bg-accent/10 transition-all mb-1"
                    >
                      <Settings size={20} className="text-muted-foreground" />
                      <span>Настройки</span>
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
                  <Link 
                    href="/login" 
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-center block shadow-lg shadow-primary/20"
                  >
                    Войти в систему
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
