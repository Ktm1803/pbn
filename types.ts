
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

export type MarketplaceType = 'SAV' | 'Namecheap' | 'Registry';

export interface FilterConfig {
  minDR: number;
  minUR: number;
  minRD: number;
  minTF: number;
  minCF: number;
  maxPrice: number;
  excludeAdult: boolean;
  excludeGambling: boolean;
  allowedTLDs: string[];
}

export interface DomainEntity {
  id: string;
  url: string;
  dr: number;
  ur: number;
  rd: number;
  tf: number;
  cf: number;
  traffic: number; 
  anchorStatus: 'Clean' | 'Spam' | 'Mixed';
  indexed: boolean;
  waybackClean: boolean;
  archiveSnapshots: number; 
  archiveFirstSeen: number; 
  status: DomainStatus;
  checkProgress: number;
  age: number;
  isExpired: boolean;
  price: number;
  marketplace: MarketplaceType;
  isAuction: boolean;
  auctionEndsAt?: number;
  bidCount?: number;
}

export interface BugReport {
  id: string;
  email: string;
  content: string;
  createdAt: number;
  status: 'new' | 'resolved';
}

export type PlanType = '1_month' | '6_months' | '1_year';

export interface User {
  email: string;
  password: string;
  role: 'admin' | 'user';
  subscriptionStatus: 'active' | 'inactive' | 'pending';
  plan?: PlanType;
  paymentCode: string;
  expiryDate?: number;
  createdAt: number;
  isLocked?: boolean;
}

export interface AccessKey {
  code: string;
  plan: PlanType;
  isUsed: boolean;
  createdAt: number;
  usedBy?: string;
  usedAt?: number;
}

export const PLANS = {
  '1_month': { name: '1 Tháng', price: 100000, durationDays: 30 },
  '6_months': { name: '6 Tháng', price: 300000, durationDays: 180 },
  '1_year': { name: '1 Năm', price: 500000, durationDays: 365 },
};
