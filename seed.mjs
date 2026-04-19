import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runSeed() {
  console.log('🌱 Начинаем заполнение тестовыми данными...');

  // 1. Create fake users
  const fakeUsers = [
    { email: 'buyer1@test.com', password: 'password123', name: 'Иван Заказчиков', role: 'USER', trust_score: 95, balance: 150000, date_of_birth: '1990-05-12' },
    { email: 'seller1@test.com', password: 'password123', name: 'Алина Дизайнер', role: 'USER', trust_score: 100, balance: 15000, date_of_birth: '2008-11-20', is_minor: true },
    { email: 'parent1@test.com', password: 'password123', name: 'Мама Алины', role: 'PARENT', trust_score: 100, balance: 0 }
  ];

  const userIds = {};

  for (const u of fakeUsers) {
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { full_name: u.name } }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`Пользователь ${u.email} уже существует. Пытаемся залогиниться для получения ID...`);
        const { data: loginData } = await supabase.auth.signInWithPassword({ email: u.email, password: u.password });
        if (loginData?.user) {
          userIds[u.role] = loginData.user.id;
          if (u.role === 'USER' && u.name.includes('Алина')) userIds['SELLER'] = loginData.user.id;
          if (u.role === 'USER' && u.name.includes('Иван')) userIds['BUYER'] = loginData.user.id;
        }
      } else {
        console.error('Ошибка создания:', authError.message);
      }
    } else if (authUser.user) {
      userIds[u.role] = authUser.user.id;
      if (u.role === 'USER' && u.name.includes('Алина')) userIds['SELLER'] = authUser.user.id;
      if (u.role === 'USER' && u.name.includes('Иван')) userIds['BUYER'] = authUser.user.id;

      let parent_email = null;
      if (u.is_minor) parent_email = 'parent1@test.com';

      const { error: profileErr } = await supabase.from('profiles').insert({
        id: authUser.user.id,
        name: u.name,
        role: u.role,
        parent_email: parent_email,
        date_of_birth: u.date_of_birth || null,
        is_minor: u.is_minor || false,
        trust_score: u.trust_score,
        balance: u.balance,
        completed_jobs: u.role === 'SELLER' ? 5 : 0
      });

      if (profileErr) console.error('Ошибка профиля:', profileErr.message);
      else console.log(`Профиль ${u.name} создан.`);
    }
  }

  // Login as seller to create services
  if (userIds['SELLER']) {
    await supabase.auth.signInWithPassword({ email: 'seller1@test.com', password: 'password123' });
    
    console.log('Создаем тестовые услуги...');
    const { data: services } = await supabase.from('services').insert([
      {
        owner_id: userIds['SELLER'],
        title: 'Дизайн логотипа для стартапа',
        description: 'Сделаю крутой и современный логотип. 3 варианта на выбор, любые цвета. Работаю быстро.',
        price: 15000,
        category: 'Дизайн',
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800',
        rating: 4.8,
        reviews_count: 5,
        milestones: [
          { title: 'Скетчи', amount: 5000 },
          { title: 'Цветные варианты', amount: 5000 },
          { title: 'Финальный файл', amount: 5000 }
        ]
      },
      {
        owner_id: userIds['SELLER'],
        title: 'Баннеры для соцсетей',
        description: 'Пак из 5 баннеров для Instagram и VK по вашему ТЗ.',
        price: 8000,
        category: 'Дизайн',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800',
        rating: 5.0,
        reviews_count: 2,
        milestones: [{ title: 'Готовые баннеры', amount: 8000 }]
      }
    ]).select();

    if (services && services.length > 0) {
      console.log('Услуги созданы. Имитируем активную сделку...');
      
      const { data: activeTx } = await supabase.from('transactions').insert({
        service_id: services[0].id,
        buyer_id: userIds['BUYER'],
        seller_id: userIds['SELLER'],
        amount: services[0].price,
        status: 'ACTIVE',
        requirements: 'Нужно сделать лого с лисой. Цвета оранжевый и черный.',
        milestones_progress: [
          { id: 0, title: 'Скетчи', amount: 5000, status: 'done' },
          { id: 1, title: 'Цветные варианты', amount: 5000, status: 'pending' },
          { id: 2, title: 'Финальный файл', amount: 5000, status: 'pending' }
        ]
      }).select().single();

      if (activeTx) {
         await supabase.from('messages').insert({
           transaction_id: activeTx.id,
           sender_id: userIds['BUYER'],
           text: 'Привет, Алина! Когда сможешь скинуть скетчи?'
         });
         await supabase.from('messages').insert({
           transaction_id: activeTx.id,
           sender_id: userIds['SELLER'],
           text: 'Привет! Уже скинула первый вариант.'
         });
      }

      console.log('Имитируем завершенную сделку...');
      await supabase.from('transactions').insert({
        service_id: services[1].id,
        buyer_id: userIds['BUYER'],
        seller_id: userIds['SELLER'],
        amount: services[1].price,
        status: 'COMPLETED',
        requirements: 'Сделать 5 баннеров для поста про распродажу.',
        result: 'Вот ссылка на яндекс диск: https://ya.disk/12345'
      });
    }
  }

  console.log('✅ Готово! Вы можете зайти под аккаунтами:');
  console.log('1. Заказчик: buyer1@test.com / password123');
  console.log('2. Школьник-Исполнитель: seller1@test.com / password123');
  console.log('3. Родитель: parent1@test.com / password123');
}

runSeed();
