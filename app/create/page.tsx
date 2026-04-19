'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ShieldCheck, HelpCircle, ArrowRight, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function CreateServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Дизайн',
    price: ''
  });

  const [milestones, setMilestones] = useState([
    { title: 'Черновик / Концепт', amount: '' },
    { title: 'Финальный результат', amount: '' }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Вам нужно войти в аккаунт, чтобы создать услугу.');
      return;
    }
    
    setIsLoading(true);
    try {
      const insertData: any = {
        owner_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseInt(formData.price),
      };

      // Try with milestones first; fall back without if column doesn't exist
      let { error } = await supabase.from('services').insert({ ...insertData, milestones });

      if (error && error.code === '42703') {
        // Column doesn't exist yet — insert without it
        const { error: error2 } = await supabase.from('services').insert(insertData);
        if (error2) throw error2;
      } else if (error) {
        throw error;
      }

      alert('Услуга успешно создана и опубликована!');
      router.push('/browse');
      router.refresh();
    } catch (err: any) {
      alert('Ошибка при создании: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Создать услугу</h1>
        <p className="text-muted-foreground font-medium">Опишите, что вы умеете делать и установите честную цену.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-[40px] p-10 border border-border space-y-8 card-shadow">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full"></div>
            Основная информация
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Название услуги</label>
              <input 
                type="text" 
                placeholder="Напр: Сделаю логотип для вашего канала" 
                className="w-full p-5 rounded-3xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Категория</label>
                <select 
                  className="w-full p-5 rounded-3xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Дизайн</option>
                  <option>Программирование</option>
                  <option>Тексты</option>
                  <option>Видео</option>
                  <option>Маркетинг</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Базовая цена (₸)</label>
                <input 
                  type="number" 
                  placeholder="Напр: 15000" 
                  className="w-full p-5 rounded-3xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-black"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Описание</label>
              <textarea 
                rows={4}
                placeholder="Расскажите подробнее о том, что входит в стоимость..." 
                className="w-full p-6 rounded-[32px] border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium leading-relaxed"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Milestones & Pricing */}
        <div className="bg-white rounded-[40px] p-10 border border-border space-y-8 card-shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <div className="w-1.5 h-8 bg-success rounded-full"></div>
              Этапы и Оплата
            </h2>
            <HelpCircle size={20} className="text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
          </div>

          <div className="p-6 bg-success/5 rounded-3xl border border-success/10 flex gap-4">
             <ShieldCheck className="text-success shrink-0" size={24} />
             <p className="text-sm text-foreground/80 leading-relaxed font-medium">
               Для безопасности заказчика мы разбиваем работу на этапы. Оплата за каждый этап будет поступать на ваш баланс сразу после его подтверждения заказчиком.
             </p>
          </div>
          
          <div className="space-y-4">
            {milestones.map((ms, index) => (
              <div key={index} className="flex gap-4 items-start animate-in fade-in slide-in-from-top-2">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    placeholder="Название этапа" 
                    value={ms.title}
                    onChange={(e) => {
                      const newMs = [...milestones];
                      newMs[index].title = e.target.value;
                      setMilestones(newMs);
                    }}
                    className="w-full p-5 rounded-3xl border border-border bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-bold"
                  />
                </div>
                <div className="w-32 space-y-2">
                  <input 
                    type="number" 
                    placeholder="₸" 
                    value={ms.amount}
                    onChange={(e) => {
                      const newMs = [...milestones];
                      newMs[index].amount = e.target.value;
                      setMilestones(newMs);
                    }}
                    className="w-full p-5 rounded-3xl border border-border bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-black text-primary"
                  />
                </div>
                {milestones.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="p-5 text-destructive hover:bg-destructive/10 rounded-3xl transition-all"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>
            ))}

            <button 
              type="button"
              onClick={addMilestone}
              className="w-full py-5 border-4 border-dashed border-slate-100 rounded-[32px] text-muted-foreground font-black text-sm uppercase tracking-widest hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              Добавить этап
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-6 border-2 border-border rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all order-2 sm:order-1"
          >
            Отмена
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="flex-[2] py-6 bg-primary text-white font-black rounded-3xl hover:bg-primary/90 transition-all flex items-center justify-center gap-4 shadow-xl shadow-primary/20 order-1 sm:order-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={24} />
                Опубликовать услугу
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
