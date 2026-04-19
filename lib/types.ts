export type UserRole = 'USER' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  parent_email?: string;
  avatar?: string;
  balance: number;
  trust_score: number;
  completed_jobs: number;
  age?: number;
  is_minor?: boolean;
  is_verified?: boolean;
  verification_status?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  verification_confidence?: number;
  parent_id?: string;
}

export interface Service {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviews_count: number;
  milestones: MilestoneTemplate[];
  image?: string;
}

export interface MilestoneTemplate {
  title: string;
  amount: number;
}

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'FROZEN';
  escrow_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  transaction_id: string;
  title: string;
  amount: number;
  status: 'LOCKED' | 'RELEASED' | 'PENDING_APPROVAL';
}

export interface Message {
  id: string;
  transaction_id: string;
  sender_id: string;
  text: string;
  timestamp: string;
}
