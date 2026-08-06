
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
  excludeHyphenDomains: boolean;
  minArchiveSnapshots: number;
  maxArchiveFirstSeenYear: number;
  requireArchiveHistory: boolean;
  enableDeepWaybackAudit: boolean;
  excludeWayback301Spam: boolean;
  excludeWaybackForeignLanguageSpam: boolean;
  requireViewDnsHistory?: boolean;
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
  waybackScore: number;
  waybackSpamFlags: string[];
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
  growthPotentialScore?: number;
  isHighPotential?: boolean;
  growthPotentialReasons?: string[];
  liveAvailability?: 'checking' | 'available' | 'registered_active' | 'unknown';
  dnsStatusMessage?: string;
  viewDnsStatus?: 'checking' | 'has_history' | 'no_history' | 'unknown';
  viewDnsIPCount?: number;
  viewDnsMessage?: string;
  isDuplicate?: boolean;
  duplicateCount?: number;
}

export interface GrowthEvaluation {
  score: number;
  isHighPotential: boolean;
  reasons: string[];
}

export function evaluateGrowthPotential(d: Partial<DomainEntity>): GrowthEvaluation {
  let score = 0;
  const reasons: string[] = [];

  const traffic = d.traffic || 0;
  const snapshots = d.archiveSnapshots || 0;
  const firstSeen = d.archiveFirstSeen || 0;
  const age = firstSeen > 0 ? (2026 - firstSeen) : (d.age || 0);
  const waybackScore = d.waybackScore || 0;
  const hasSpam = Boolean(d.waybackSpamFlags && d.waybackSpamFlags.length > 0);
  const dr = d.dr || 0;
  const tf = d.tf || 0;

  // 1. Organic Traffic Score (Up to 40 pts)
  if (traffic >= 5000) {
    score += 40;
    reasons.push(`Traffic cao (${traffic.toLocaleString()}/tháng)`);
  } else if (traffic >= 1200) {
    score += 30;
    reasons.push(`Traffic tốt (${traffic.toLocaleString()}/tháng)`);
  } else if (traffic >= 350) {
    score += 20;
    reasons.push(`Traffic khởi điểm (${traffic.toLocaleString()}/tháng)`);
  } else if (traffic >= 50) {
    score += 10;
  }

  // 2. Archive History & Stability Score (Up to 35 pts)
  if (snapshots >= 30 && age >= 5) {
    score += 25;
    reasons.push(`Lịch sử Archive lâu năm (${age} năm, ${snapshots} snapshots)`);
  } else if (snapshots >= 10 && age >= 2) {
    score += 15;
    reasons.push(`Tồn tại ổn định trên Archive.org (${age} năm, ${snapshots} snapshots)`);
  } else if (snapshots >= 1) {
    score += 5;
  }

  if (waybackScore >= 75 && !hasSpam) {
    score += 10;
    reasons.push(`Điểm Wayback uy tín (${waybackScore}/100)`);
  }

  // 3. SEO Metrics & Google Index (Up to 25 pts)
  if (dr >= 15 || tf >= 12) {
    score += 15;
    reasons.push(`Sức mạnh SEO tốt (DR:${dr}, TF:${tf})`);
  } else if (dr >= 8 || tf >= 5) {
    score += 8;
  }

  if (d.indexed) {
    score += 10;
    reasons.push(`Đã Index trên Google`);
  }

  // High Potential threshold: Score >= 55, Traffic >= 350, Snapshots >= 5, No spam flags
  const isHighPotential = Boolean(score >= 55 && traffic >= 300 && snapshots >= 5 && waybackScore >= 50 && !hasSpam);

  return {
    score,
    isHighPotential,
    reasons
  };
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
