'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ShoppingBag, Briefcase, ShieldCheck, UserCircle } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutGrid, label: 'Каталог', href: '/browse' },
    { icon: ShoppingBag, label: 'Покупки', href: '/orders' },
    { icon: Briefcase, label: 'Услуги', href: '/my-services' },
    { icon: ShieldCheck, label: 'Опека', href: '/parent' },
    { icon: UserCircle, label: 'Профиль', href: '/profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-50 bg-white/90 backdrop-blur-xl border border-border/40 px-3 py-3 flex justify-around items-center lg:hidden rounded-[32px] shadow-premium animate-in slide-in-from-bottom-8 duration-700">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 px-4 py-2 transition-all rounded-[20px] ${
              isActive ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-all" />
            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
