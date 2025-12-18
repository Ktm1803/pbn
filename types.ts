
export enum Step {
  Crawl = 1,
  Filter = 2,
  PenaltyCheck = 3,
  Output = 4,
}

export enum DomainStatus {
  Pending = 'Pending',
  Analyzing = 'Analyzing',
  Clean = 'Clean',
  Spam = 'Spam',
  Penalized = 'Penalized',
  Ignored = 'Ignored',
}

export interface FilterConfig {
  minDR: number;
  minUR: number;
  minRD: number;
  minTF: number;
  minCF: number;
  maxPrice: number; // Added max price filter
  excludeAdult: boolean;
  excludeGambling: boolean;
  allowedTLDs: string[]; // List of allowed TLDs (empty = all)
}

export interface DomainEntity {
  id: string;
  url: string;
  dr: number; // Domain Rating
  ur: number; // URL Rating
  rd: number; // Referring Domains
  tf: number; // Trust Flow
  cf: number; // Citation Flow
  anchorStatus: 'Clean' | 'Spam' | 'Mixed';
  indexed: boolean;
  waybackClean: boolean;
  status: DomainStatus;
  checkProgress: number; // 0-100
  age: number; // Years
  isExpired: boolean;
  price: number; // Estimated price in USD
}

export interface Stats {
  totalFound: number;
  passedFilters: number;
  cleanDomains: number;
}

// --- AUTH & SUBSCRIPTION TYPES ---

export type PlanType = '1_month' | '6_months' | '1_year';

export interface User {
  email: string;
  password: string; // In a real app, this should be hashed
  role: 'admin' | 'user';
  subscriptionStatus: 'active' | 'inactive' | 'pending';
  plan?: PlanType;
  paymentCode: string; // Unique code for transfer
  expiryDate?: number; // Timestamp
  createdAt: number;
}

// New Interface for Access Keys
export interface AccessKey {
  code: string;
  plan: PlanType;
  isUsed: boolean;
  createdAt: number;
  usedBy?: string; // Email of the user who redeemed it
  usedAt?: number;
}

export const PLANS = {
  '1_month': { name: '1 Tháng', price: 100000, durationDays: 30 },
  '6_months': { name: '6 Tháng', price: 300000, durationDays: 180 },
  '1_year': { name: '1 Năm', price: 500000, durationDays: 365 },
};
