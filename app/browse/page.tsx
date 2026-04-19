'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Heart, Star, UserCircle, Loader2, X, ArrowUpDown, TrendingUp, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

export default function BrowsePage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedSort, setAppliedSort] = useState<SortOption>('newest');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const categories = ['Все', 'Дизайн', 'Программирование', 'Тексты', 'Видео', 'Маркетинг'];

  const sortOptions: { id: SortOption; label: string; icon: any }[] = [
    { id: 'newest', label: 'Сначала новые', icon: Clock },
    { id: 'price_asc', label: 'Цена: по возрастанию', icon: DollarSign },
    { id: 'price_desc', label: 'Цена: по убыванию', icon: DollarSign },
    { id: 'rating', label: 'По рейтингу', icon: Star },
  ];

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, owner_id, title, description, price, category, image, rating, created_at, profiles(name, avatar)');

        if (error) {
          console.error('Error fetching services:', error.message);
        } else {
          setServices(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Close filter panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFilters]);

  const applyFilters = () => {
    setAppliedSort(sortBy);
    setAppliedMin(minPrice);
    setAppliedMax(maxPrice);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setAppliedSort('newest');
    setAppliedMin('');
    setAppliedMax('');
  };

  const hasActiveFilters = appliedSort !== 'newest' || appliedMin || appliedMax;

  let filteredServices = services.filter(service => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (service.title || '').toLowerCase().includes(q) ||
      (service.description || '').toLowerCase().includes(q) ||
      (service.category || '').toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'Все' || service.category === selectedCategory;
    const matchesMin = !appliedMin || service.price >= parseInt(appliedMin);
    const matchesMax = !appliedMax || service.price <= parseInt(appliedMax);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  // Sort
  filteredServices = [...filteredServices].sort((a, b) => {
    if (appliedSort === 'price_asc') return a.price - b.price;
    if (appliedSort === 'price_desc') return b.price - a.price;
    if (appliedSort === 'rating') return (b.rating || 0) - (a.rating || 0);
    // newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black">Каталог услуг</h1>
          <p className="text-muted-foreground font-medium">Найдите профессиональную помощь от лучших фрилансеров.</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 relative">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Монтаж видео, дизайн логотипа..."
              className="w-full pl-14 pr-6 py-5 rounded-[24px] border border-border/60 bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-soft"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] border font-black transition-all shadow-soft group ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white border-border/60 hover:bg-accent/5'
              }`}
            >
              <SlidersHorizontal size={20} className={showFilters || hasActiveFilters ? 'text-white' : 'text-muted-foreground group-hover:text-primary transition-colors'} />
              Фильтры
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center">
                  {[appliedSort !== 'newest', !!appliedMin, !!appliedMax].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Filter Dropdown Panel */}
            {showFilters && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-80 bg-white rounded-[32px] border border-border shadow-2xl z-50 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Sort */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Сортировка</p>
                  <div className="space-y-2">
                    {sortOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                          sortBy === opt.id
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'hover:bg-accent/5 text-muted-foreground border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <opt.icon size={16} />
                          {opt.label}
                        </div>
                        {sortBy === opt.id && <CheckCircle2 size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Диапазон цен (₸)</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="от"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold"
                    />
                    <span className="text-muted-foreground font-black">—</span>
                    <input
                      type="number"
                      placeholder="до"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 border-t border-border/40">
                  <button
                    onClick={resetFilters}
                    className="flex-1 py-3 rounded-2xl border border-border font-black text-sm hover:bg-accent/5 transition-all"
                  >
                    Сбросить
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-[2] py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-all"
                  >
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
            {appliedSort !== 'newest' && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary text-xs font-bold rounded-xl">
                {sortOptions.find(s => s.id === appliedSort)?.label}
                <button onClick={() => { setSortBy('newest'); setAppliedSort('newest'); }}><X size={12} /></button>
              </span>
            )}
            {appliedMin && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary text-xs font-bold rounded-xl">
                от {parseInt(appliedMin).toLocaleString()} ₸
                <button onClick={() => { setMinPrice(''); setAppliedMin(''); }}><X size={12} /></button>
              </span>
            )}
            {appliedMax && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary text-xs font-bold rounded-xl">
                до {parseInt(appliedMax).toLocaleString()} ₸
                <button onClick={() => { setMaxPrice(''); setAppliedMax(''); }}><X size={12} /></button>
              </span>
            )}
          </div>
        )}

        {/* Categories scroll */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white border border-border/60 text-muted-foreground hover:border-primary/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="text-muted-foreground font-bold animate-pulse">Загружаем лучшие предложения...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.length > 0 ? (
            filteredServices.map((service: any) => (
              <Link key={service.id} href={`/service/${service.id}`} className="premium-card rounded-[40px] flex flex-col group h-full">
                <div className="aspect-[1.4/1] relative overflow-hidden p-3 pb-0">
                  <img
                    src={service.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'}
                    alt={service.title}
                    className="w-full h-full object-cover rounded-[32px] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                    {service.category}
                  </div>
                  <button className="absolute top-6 right-6 p-2.5 bg-white/95 backdrop-blur-md rounded-2xl text-muted-foreground hover:text-destructive transition-all shadow-sm">
                    <Heart size={18} />
                  </button>
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
                    <h3 className="text-xl font-black leading-tight">{service.title}</h3>
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
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-8 bg-white rounded-[48px] border border-border/60 p-12 card-shadow">
              <div className="space-y-3 max-w-sm mx-auto">
                <h3 className="text-2xl font-black italic">Ничего не нашли?</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Попробуйте изменить запрос или сбросить фильтры.
                </p>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('Все'); resetFilters(); }}
                className="btn-ghost py-4 px-8 border border-border/60"
              >
                Сбросить всё
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
