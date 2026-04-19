import { User, Service, Transaction, Milestone, Message } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Teen',
    email: 'alex@example.com',
    role: 'USER',
    balance: 15000,
    trust_score: 98,
    completed_jobs: 12,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: 'u2',
    name: 'Sarah Client',
    email: 'sarah@example.com',
    role: 'USER',
    balance: 500000,
    trust_score: 100,
    completed_jobs: 45,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: 'u3',
    name: 'Michael Parent',
    email: 'michael@example.com',
    role: 'PARENT',
    balance: 20000,
    trust_score: 100,
    completed_jobs: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
  }
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    owner_id: 'u1',
    title: 'Монтаж видео для TikTok и Reels',
    description: 'Создам динамичный монтаж вашего видео: переходы, субтитры, трендовая музыка. Идеально для личных блогов и брендов.',
    price: 15000,
    category: 'Видео',
    rating: 4.9,
    reviews_count: 24,
    milestones: [
      { title: 'Черновой монтаж', amount: 5000 },
      { title: 'Финальный экспорт с цветокоррекцией', amount: 10000 }
    ],
    image: 'https://images.unsplash.com/photo-1574717024158-94435868ccde?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 's2',
    owner_id: 'u1',
    title: 'Оформление Discord серверов',
    description: 'Настрою роли, каналы, добавлю ботов и создам уникальный визуальный стиль для вашего сообщества.',
    price: 8000,
    category: 'Дизайн',
    rating: 5.0,
    reviews_count: 12,
    milestones: [
      { title: 'Настройка структуры и ботов', amount: 3000 },
      { title: 'Визуальное оформление и баннеры', amount: 5000 }
    ],
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 's3',
    owner_id: 'u1',
    title: 'Разработка простых 2D игр на Python',
    description: 'Напишу простую игру или прототип на Pygame. Чистый код, комментарии и помощь в запуске.',
    price: 35000,
    category: 'Программирование',
    rating: 4.8,
    reviews_count: 7,
    milestones: [
      { title: 'Прототип механики', amount: 15000 },
      { title: 'Полная игра с ассетами', amount: 20000 }
    ],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [];
export const MOCK_MILESTONES: Milestone[] = [];
export const MOCK_MESSAGES: Message[] = [];
