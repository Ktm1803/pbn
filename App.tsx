
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { FilterControl } from './components/FilterControl';
import { Step, DomainEntity, DomainStatus, FilterConfig, User, PLANS, MarketplaceType, evaluateGrowthPotential, calculateSEODifficulty } from './types';
import { analyzeDomainBatch, generateMockDomains, checkWaybackBatch } from './services/geminiService';
import { getCurrentUser, logout, submitBugReport } from './services/authService';
import { AuthForm, SubscriptionPlan, AdminDashboard } from './components/AuthComponents';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
  Play, Settings, CheckCircle2, AlertTriangle, Download, RefreshCw, Search, Bot, 
  Globe, ShieldCheck, Filter, PlusCircle, DollarSign, History, ExternalLink, 
  ShoppingCart, CheckSquare, Square, X, XCircle, LogOut, Smartphone, Shield, 
  Gavel, Zap, Clock, Activity, Database, HardDrive, Layers, Trash2, TrendingUp, Plus, Eye, Loader2, Bug, ShieldAlert, RotateCcw, Send, MessageSquare, Copy, Archive, Flame, Sparkles, Server, PieChart as PieChartIcon, BarChart3
} from 'lucide-react';

const REG_FEES: Record<string, number> = {
  '.com': 10.28, '.net': 11.98, '.org': 9.68, '.info': 3.98, '.co': 23.98, '.io': 39.98,
  '.co.net': 15.00, '.uk.net': 12.99, '.us.net': 12.99, '.co.org': 15.00, '.uk.org': 9.50, 
  '.jp.net': 14.50, '.jp.co': 40.00, '.co.jp': 40.00, '.xyz': 0.99, '.site': 1.99
};

const INITIAL_TLDS = Object.keys(REG_FEES);
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

interface TrafficForecastSparklineProps {
  domain: DomainEntity;
}

const TrafficForecastSparkline: React.FC<TrafficForecastSparklineProps> = ({ domain }) => {
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);

  const forecastData = useMemo(() => {
    const currentTraffic = domain.traffic || 0;
    const dr = domain.dr || 0;
    const rd = domain.rd || 0;
    const score = domain.growthPotentialScore || 50;
    
    // Baseline potential for domains with low or 0 traffic but good DR/RD
    const baseVal = Math.max(currentTraffic, Math.round((dr * 12 + rd * 3 + score * 4)));
    
    // Growth velocity factor based on domain metrics
    const growthRate = 0.08 + (score / 100) * 0.18 + (dr > 30 ? 0.08 : dr > 15 ? 0.04 : 0.01);

    const months = [
      { month: 'Hiện tại', label: 'T0', val: currentTraffic },
      { month: 'Tháng 1', label: 'T1', val: Math.round(baseVal * (1 + growthRate * 0.4)) },
      { month: 'Tháng 2', label: 'T2', val: Math.round(baseVal * (1 + growthRate * 0.9)) },
      { month: 'Tháng 3', label: 'T3', val: Math.round(baseVal * (1 + growthRate * 1.5)) },
      { month: 'Tháng 4', label: 'T4', val: Math.round(baseVal * (1 + growthRate * 2.2)) },
      { month: 'Tháng 5', label: 'T5', val: Math.round(baseVal * (1 + growthRate * 3.0)) },
      { month: 'Tháng 6', label: 'T6', val: Math.round(baseVal * (1 + growthRate * 4.0)) },
    ];

    const minVal = Math.min(...months.map(m => m.val));
    const maxVal = Math.max(...months.map(m => m.val), 10);

    const projectedM6 = months[6].val;
    const growthPercent = currentTraffic > 0 
      ? Math.round(((projectedM6 - currentTraffic) / currentTraffic) * 100)
      : Math.round(((projectedM6 - Math.max(1, baseVal)) / Math.max(1, baseVal)) * 100 + 150);

    return { months, minVal, maxVal, projectedM6, growthPercent };
  }, [domain.traffic, domain.dr, domain.rd, domain.growthPotentialScore]);

  const { months, minVal, maxVal, projectedM6, growthPercent } = forecastData;

  const width = 190;
  const height = 40;
  const padding = 5;

  const points = months.map((m, idx) => {
    const x = padding + (idx / (months.length - 1)) * (width - padding * 2);
    const range = maxVal - minVal || 1;
    const y = height - padding - ((m.val - minVal) / range) * (height - padding * 2);
    return { x, y, val: m.val, label: m.label, month: m.month };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  const isHighGrowth = (domain.growthPotentialScore || 50) >= 70;
  const strokeColor = isHighGrowth ? '#10b981' : (domain.growthPotentialScore || 50) >= 50 ? '#f59e0b' : '#3b82f6';
  const strokeGradId = `traffic-grad-${domain.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  const activePoint = hoverMonth !== null ? points[hoverMonth] : null;

  return (
    <div className="mt-2 p-2 rounded-xl bg-slate-950/90 border border-slate-800/80 shadow-inner group/sparkline relative">
      <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold mb-1">
        <span className="text-slate-400 flex items-center gap-1">
          <TrendingUp size={11} className={isHighGrowth ? "text-emerald-400" : "text-amber-400"} />
          Dự báo Traffic (6T):
        </span>
        <span className={`font-mono text-[9px] font-black px-1.5 py-0.2 rounded border ${
          growthPercent >= 100 
            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' 
            : 'bg-amber-950/80 text-amber-400 border-amber-800/80'
        }`}>
          +{growthPercent}% ➔ ~{projectedM6 >= 1000 ? `${(projectedM6 / 1000).toFixed(1)}k` : projectedM6}/tháng
        </span>
      </div>

      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id={strokeGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill={`url(#${strokeGradId})`} />

          {/* Line path */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoverMonth === idx ? "3.5" : "2"}
              fill={hoverMonth === idx ? "#ffffff" : strokeColor}
              stroke={strokeColor}
              strokeWidth="1.2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoverMonth(idx)}
              onMouseLeave={() => setHoverMonth(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {activePoint && (
          <div 
            className="absolute -top-7 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded border border-slate-700 shadow-xl pointer-events-none z-30 whitespace-nowrap flex items-center gap-1"
            style={{ left: `${(activePoint.x / width) * 100}%` }}
          >
            <span className="text-slate-400">{activePoint.month}:</span>
            <span className="text-emerald-400 font-mono">~{activePoint.val.toLocaleString()} visit</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-1 px-0.5">
        <span>T0 ({domain.traffic.toLocaleString()})</span>
        <span>T3 (~{points[3].val >= 1000 ? `${(points[3].val / 1000).toFixed(1)}k` : points[3].val})</span>
        <span className="text-emerald-400 font-bold">T6 (~{projectedM6 >= 1000 ? `${(projectedM6 / 1000).toFixed(1)}k` : projectedM6})</span>
      </div>
    </div>
  );
};

const CustomTrafficTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-700 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 z-50">
        <div className="font-black text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
          <span>{data.name}</span>
        </div>
        <div className="text-slate-300 font-mono">
          Số lượng: <b className="text-white">{data.value.toLocaleString()} domain</b>
        </div>
        <div className="text-slate-300 font-mono">
          Chiếm tỷ lệ: <b className="text-emerald-400">{data.percentage}%</b>
        </div>
        <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
          Phạm vi: {data.range}
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [bugContent, setBugContent] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(Step.Crawl);
  const [domains, setDomains] = useState<DomainEntity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [seedKeyword, setSeedKeyword] = useState("marketing");
  const [scanLimit, setScanLimit] = useState(1000); 
  const [customTld, setCustomTld] = useState("");
  const [availableTlds, setAvailableTlds] = useState<string[]>(INITIAL_TLDS);
  const [showBulkTldModal, setShowBulkTldModal] = useState(false);
  const [bulkTldInput, setBulkTldInput] = useState("");
  const [filterMode, setFilterMode] = useState<'all' | 'high_potential' | 'available_only' | 'has_viewdns_history' | 'duplicate_only'>('all');
  const [trafficFilter, setTrafficFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [singleCopiedId, setSingleCopiedId] = useState<string | null>(null);
  const [isLiveChecking, setIsLiveChecking] = useState(false);
  const [isViewDnsChecking, setIsViewDnsChecking] = useState(false);
  const MAX_STORAGE = 1000000;

  const handleBulkTldAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bulkTldInput.trim()) return;

    const rawTokens = bulkTldInput.split(/[\s,;\n\r]+/);
    const newTlds: string[] = [];

    rawTokens.forEach(token => {
      let cleaned = token.trim().toLowerCase();
      if (!cleaned) return;
      if (!cleaned.startsWith('.')) {
        cleaned = '.' + cleaned;
      }
      if (/^\.[a-z0-9.-]+$/.test(cleaned) && !availableTlds.includes(cleaned) && !newTlds.includes(cleaned)) {
        newTlds.push(cleaned);
      }
    });

    if (newTlds.length > 0) {
      setAvailableTlds(prev => [...prev, ...newTlds]);
      addLog(`Đã thêm hàng loạt ${newTlds.length} TLD mới: ${newTlds.join(', ')}`);
    }
    setBulkTldInput("");
    setShowBulkTldModal(false);
  };

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    minDR: 10, minUR: 10, minRD: 5, minTF: 5, minCF: 5, 
    maxPrice: 40, 
    excludeAdult: true, excludeGambling: true, excludeHyphenDomains: true,
    requireArchiveHistory: true,
    minArchiveSnapshots: 5,
    maxArchiveFirstSeenYear: 2021,
    enableDeepWaybackAudit: true,
    excludeWayback301Spam: true,
    excludeWaybackForeignLanguageSpam: true,
    allowedTLDs: [],
  });
  const [allowedMarketplaces, setAllowedMarketplaces] = useState<MarketplaceType[]>(['SAV', 'Namecheap', 'Registry']);
  const scannedHistoryRef = useRef<Set<string>>(new Set());

  useEffect(() => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setAuthChecked(true);
  }, []);

  useEffect(() => {
    domains.forEach(d => {
      if (d.url) {
        scannedHistoryRef.current.add(d.url.toLowerCase().trim());
      }
    });
  }, [domains]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-100));
  };

  const resetTool = () => {
    if (confirm("Bạn có chắc chắn muốn đặt lại tất cả dữ liệu và bắt đầu lượt quét mới?")) {
        setDomains([]);
        setSelectedIds(new Set());
        setCurrentStep(Step.Crawl);
        addLog("Hệ thống đã được đặt lại. Khởi động lượt quét mới...");
        setTimeout(() => {
          startCrawl(false);
        }, 100);
    }
  };

  const removeTld = (tldToRemove: string) => {
    if (INITIAL_TLDS.includes(tldToRemove)) return; 
    setAvailableTlds(prev => prev.filter(t => t !== tldToRemove));
  };

  const handleBugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bugContent.trim() && currentUser) {
        submitBugReport(currentUser.email, bugContent);
        setBugContent("");
        setShowBugReport(false);
        alert("Cảm ơn bạn! Báo cáo lỗi đã được gửi đến Admin.");
    }
  };

  const copySyncCode = () => {
    if (currentUser) {
        const syncCode = btoa(JSON.stringify(currentUser));
        navigator.clipboard.writeText(syncCode);
        alert("Đã sao chép mã đồng bộ vào bộ nhớ tạm!");
    }
  };

  const startCrawl = async (isAppending: boolean = false) => {
    if (!isAppending) {
        setDomains([]);
        setSelectedIds(new Set());
        setCurrentStep(Step.Crawl);
    }
    
    setIsProcessing(true);
    const existingHistoryCount = scannedHistoryRef.current.size;
    if (existingHistoryCount > 0) {
      addLog(`🛡️ Chống quét trùng lặp: Hệ thống đang tự động bỏ qua ${existingHistoryCount.toLocaleString()} domain đã từng quét...`);
    }
    addLog(`${isAppending ? 'Đang quét thêm' : 'Khởi động engine quét'} ${scanLimit.toLocaleString()} domain...`);
    
    try {
      let realisticNames: string[] = [];
      try {
        realisticNames = await generateMockDomains(seedKeyword);
      } catch (err) {
        console.error("Failed mock domain generation:", err);
      }
      
      if (!realisticNames || realisticNames.length === 0) {
        const cleanKey = seedKeyword.replace(/-/g, '');
        realisticNames = [`${cleanKey}news.com`, `old${cleanKey}.net`, `my${cleanKey}.org`, `the${cleanKey}group.com`, `${cleanKey}tech.io`];
      }

      let processed = 0;
      let skippedDuplicatesCount = 0;
      const batchSize = 100;

      const runBatch = () => {
        if (processed >= scanLimit) {
          setIsProcessing(false);
          addLog(`Hoàn tất quét. Đã xử lý xong ${scanLimit.toLocaleString()} domain mới.`);
          if (skippedDuplicatesCount > 0) {
            addLog(`🛡️ Đã tự động bỏ qua ${skippedDuplicatesCount.toLocaleString()} tên miền bị trùng lặp với lịch sử quét.`);
          }
          
          if (!isAppending) {
            setCurrentStep(Step.Filter);
          } else {
            addLog("Đang tự động áp dụng bộ lọc và kiểm tra Wayback cho lô domain quét thêm...");
            setTimeout(() => {
              autoAuditNewDomains();
            }, 100);
          }
          return;
        }

        const newBatch: DomainEntity[] = [];
        for (let i = 0; i < batchSize && processed < scanLimit; i++) {
          processed++;
          
          let fullUrl = '';
          let randomTLD = '.com';
          let attempts = 0;
          do {
            const rawNameRoot = realisticNames[getRandomInt(0, realisticNames.length - 1)]?.split('.')[0] || seedKeyword;
            const nameRoot = filterConfig.excludeHyphenDomains ? rawNameRoot.replace(/-/g, '') : rawNameRoot;
            randomTLD = availableTlds[getRandomInt(0, availableTlds.length - 1)] || '.com';
            
            const extraTag = attempts > 0 ? `${getRandomInt(10, 99999)}` : '';
            const suffix = (Math.random() > 0.6 || attempts > 0) ? `${getRandomInt(1, 99)}${extraTag}` : '';
            fullUrl = `${nameRoot}${suffix}${randomTLD}`.toLowerCase().trim();
            
            attempts++;
          } while (scannedHistoryRef.current.has(fullUrl) && attempts < 50);

          if (scannedHistoryRef.current.has(fullUrl)) {
            skippedDuplicatesCount++;
          }

          // Ghi nhớ URL này vào bộ nhớ để không bao giờ quét lại
          scannedHistoryRef.current.add(fullUrl);
          
          const hasHistoryRoll = Math.random() > 0.15;
          const archiveSnapshots = hasHistoryRoll ? getRandomInt(1, 1500) : 0;
          const archiveFirstSeen = archiveSnapshots > 0 ? getRandomInt(2001, 2024) : 0;
          
          const waybackSpamFlags: string[] = [];
          if (archiveSnapshots === 0) {
            waybackSpamFlags.push('No Wayback Archive Found');
          } else {
            if (Math.random() < 0.16) waybackSpamFlags.push('301 Redirect Spam');
            if (Math.random() < 0.14) waybackSpamFlags.push('Foreign Language Shift');
            if (Math.random() < 0.10) waybackSpamFlags.push('PBN Network Footprint');
            if (Math.random() < 0.08) waybackSpamFlags.push('Gambling / Adult History');
          }

          let waybackScore = archiveSnapshots > 0 ? 100 : 0;
          if (archiveSnapshots > 0) {
            if (archiveSnapshots < 5) waybackScore -= 25;
            else if (archiveSnapshots < 15) waybackScore -= 10;
            if (archiveFirstSeen > 2021) waybackScore -= 15;
            waybackScore -= (waybackSpamFlags.length * 30);
            if (waybackScore < 0) waybackScore = 0;
          }

          const waybackClean = archiveSnapshots > 0 && waybackSpamFlags.length === 0 && waybackScore >= 60;

          const marketRoll = Math.random();
          let marketplace: MarketplaceType = 'Registry';
          let isAuction = false;
          let price = REG_FEES[randomTLD] || 15;

          if (marketRoll > 0.7) {
              marketplace = 'SAV';
              isAuction = Math.random() > 0.5;
              price = isAuction ? getRandomInt(10, 50) : price;
          } else if (marketRoll > 0.4) {
              marketplace = 'Namecheap';
              isAuction = Math.random() > 0.6;
              price = isAuction ? getRandomInt(10, 80) : price;
          }

          newBatch.push({
              id: Math.random().toString(36).substr(2, 9),
              url: fullUrl,
              dr: getRandomInt(0, 70), ur: getRandomInt(0, 50), rd: getRandomInt(0, 500),
              tf: getRandomInt(0, 45), cf: getRandomInt(0, 45), traffic: getRandomInt(0, 30000),
              anchorStatus: Math.random() > 0.3 ? 'Clean' : 'Spam', indexed: Math.random() > 0.3,
              waybackClean, waybackScore, waybackSpamFlags,
              archiveSnapshots, archiveFirstSeen,
              status: DomainStatus.Pending, checkProgress: 0, age: archiveFirstSeen > 0 ? 2026 - archiveFirstSeen : 0,
              isExpired: !isAuction, price, marketplace, isAuction,
              auctionEndsAt: isAuction ? Date.now() + getRandomInt(3600000, 86400000 * 5) : undefined,
              bidCount: isAuction ? getRandomInt(0, 50) : undefined
          });
        }

        setDomains(prev => [...prev, ...newBatch]);
        requestAnimationFrame(runBatch);
      };

      runBatch();
    } catch (err) {
      console.error("Crawl error:", err);
      setIsProcessing(false);
      addLog("❌ Lỗi khi thực hiện quét hệ thống. Đã dừng tiến trình.");
    }
  };

  const autoAuditNewDomains = () => {
    let totalDupesFound = 0;
    setDomains(prev => {
      const updated = prev.map(d => {
        if (d.status !== DomainStatus.Pending) return d;

        const meetsPrice = d.price <= filterConfig.maxPrice && d.price <= 40;
        const meetsMetrics = d.dr >= filterConfig.minDR && d.tf >= filterConfig.minTF && meetsPrice;
        const meetsMarket = allowedMarketplaces.includes(d.marketplace);
        const passesHyphenCheck = filterConfig.excludeHyphenDomains ? !d.url.includes('-') : true;
        
        const hasArchiveHistory = d.archiveSnapshots >= 1 && d.archiveFirstSeen > 0 && !d.waybackSpamFlags.includes('No Wayback Archive Found');
        const passesSnapshots = d.archiveSnapshots >= Math.max(1, filterConfig.minArchiveSnapshots);
        const passesFirstSeen = d.archiveFirstSeen > 0 && (d.archiveFirstSeen <= filterConfig.maxArchiveFirstSeenYear);

        const isValidCandidate = meetsMetrics && meetsMarket && passesHyphenCheck && hasArchiveHistory && passesSnapshots && passesFirstSeen;

        const has301Spam = d.waybackSpamFlags.includes('301 Redirect Spam');
        const hasLangSpam = d.waybackSpamFlags.includes('Foreign Language Shift');
        const hasPbnSpam = d.waybackSpamFlags.some(f => f.includes('PBN') || f.includes('Gambling'));
        const hasNoArchive = d.archiveSnapshots < 1 || d.archiveFirstSeen <= 0 || d.waybackSpamFlags.includes('No Wayback Archive Found');

        const passes301 = !filterConfig.excludeWayback301Spam || !has301Spam;
        const passesLang = !filterConfig.excludeWaybackForeignLanguageSpam || !hasLangSpam;
        const passesDeepAudit = !filterConfig.enableDeepWaybackAudit || (d.waybackClean && !hasPbnSpam);

        const isClean = isValidCandidate && d.indexed && !hasNoArchive && passes301 && passesLang && passesDeepAudit && (d.waybackScore >= 50) && meetsPrice;

        return {
          ...d,
          status: isClean ? DomainStatus.Clean : (isValidCandidate ? DomainStatus.Penalized : DomainStatus.Spam)
        };
      });

      const counts = new Map<string, number>();
      updated.forEach(d => {
        const k = d.url.toLowerCase().trim();
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      counts.forEach((val) => {
        if (val > 1) totalDupesFound += (val - 1);
      });

      return updated;
    });

    if (totalDupesFound > 0) {
      addLog(`⚠️ Quét thêm thành công! Phát hiện & đánh dấu ${totalDupesFound} tên miền trùng lặp trong danh sách.`);
    } else {
      addLog("✅ Hoàn tất thẩm định lô domain quét thêm!");
    }
  };

  const startCrawlRef = useRef(startCrawl);
  useEffect(() => {
    startCrawlRef.current = startCrawl;
  });

  // Global Keyboard Shortcut listener (Ctrl+Enter or Cmd+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (showBulkTldModal) {
          handleBulkTldAdd();
          return;
        }
        if (isProcessing || showBugReport || showSyncModal || showAdminDashboard) return;

        e.preventDefault();
        setCurrentStep(Step.Crawl);
        addLog("⚡ Phím tắt Ctrl+Enter kích hoạt: Bắt đầu truy quét hệ thống!");
        startCrawlRef.current(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, showBulkTldModal, showBugReport, showSyncModal, showAdminDashboard]);

  const applyFilters = async () => {
    setIsProcessing(true);
    
    // Bước 1: Lọc dữ liệu thô
    const updated = domains.map(d => {
      const meetsPrice = d.price <= filterConfig.maxPrice && d.price <= 40;
      const meetsMetrics = d.dr >= filterConfig.minDR && d.tf >= filterConfig.minTF && meetsPrice;
      const meetsMarket = allowedMarketplaces.includes(d.marketplace);
      const passesHyphenCheck = filterConfig.excludeHyphenDomains ? !d.url.includes('-') : true;
      
      // Bắt buộc phải có bản lưu snapshot trên web.archive.org (archiveSnapshots >= 1 & archiveFirstSeen > 0)
      const hasArchiveHistory = d.archiveSnapshots >= 1 && d.archiveFirstSeen > 0 && !d.waybackSpamFlags.includes('No Wayback Archive Found');
      const passesSnapshots = d.archiveSnapshots >= Math.max(1, filterConfig.minArchiveSnapshots);
      const passesFirstSeen = d.archiveFirstSeen > 0 && (d.archiveFirstSeen <= filterConfig.maxArchiveFirstSeenYear);

      const isValidCandidate = meetsMetrics && meetsMarket && passesHyphenCheck && hasArchiveHistory && passesSnapshots && passesFirstSeen;

      return { 
        ...d, 
        status: isValidCandidate ? DomainStatus.Analyzing : DomainStatus.Spam 
      };
    });

    setDomains(updated);
    setCurrentStep(Step.PenaltyCheck);

    // Bước 2: Chạy kiểm tra sâu Wayback API cho các ứng viên
    await runPenaltyCheckForDomains(updated);
  };

  const runPenaltyCheckForDomains = async (domainList: DomainEntity[]) => {
    setIsProcessing(true);
    const candidates = domainList.filter(d => d.status === DomainStatus.Analyzing);
    if (candidates.length === 0) {
      setIsProcessing(false);
      setCurrentStep(Step.Output);
      return;
    }
    
    // Gọi API kiểm tra xem tên miền có thực sự tồn tại bản lưu trên web.archive.org không
    const urlsToCheck = candidates.slice(0, 50).map(d => d.url);
    const waybackResults = await checkWaybackBatch(urlsToCheck);

    const finalDomains = domainList.map(d => {
      if (d.status !== DomainStatus.Analyzing) return d;

      const wb = waybackResults[d.url];
      let archiveSnapshots = d.archiveSnapshots;
      let archiveFirstSeen = d.archiveFirstSeen;
      let waybackSpamFlags = [...d.waybackSpamFlags];
      let waybackScore = d.waybackScore;
      let waybackClean = d.waybackClean;

      // Nếu API trả về kết quả cụ thể
      if (wb) {
        if (wb.available && wb.snapshotsCount && wb.snapshotsCount >= 1) {
          archiveSnapshots = wb.snapshotsCount;
          archiveFirstSeen = wb.firstSeenYear || 2018;
          waybackSpamFlags = waybackSpamFlags.filter(f => f !== 'No Wayback Archive Found');
        } else {
          // BỊ BÁO LỖI: "Wayback Machine has not archived that URL" -> 0 Snapshots -> Loại bỏ ngay!
          archiveSnapshots = 0;
          archiveFirstSeen = 0;
          if (!waybackSpamFlags.includes('No Wayback Archive Found')) {
            waybackSpamFlags.push('No Wayback Archive Found');
          }
          waybackScore = 0;
          waybackClean = false;
        }
      }

      const has301Spam = waybackSpamFlags.includes('301 Redirect Spam');
      const hasLangSpam = waybackSpamFlags.includes('Foreign Language Shift');
      const hasPbnSpam = waybackSpamFlags.some(f => f.includes('PBN') || f.includes('Gambling'));
      
      // Tuyệt đối không cho phép domain không có ảnh / snapshot archive.org (archiveSnapshots < 1)
      const hasNoArchive = archiveSnapshots < 1 || archiveFirstSeen <= 0 || waybackSpamFlags.includes('No Wayback Archive Found');

      const passes301 = !filterConfig.excludeWayback301Spam || !has301Spam;
      const passesLang = !filterConfig.excludeWaybackForeignLanguageSpam || !hasLangSpam;
      const passesDeepAudit = !filterConfig.enableDeepWaybackAudit || (waybackClean && !hasPbnSpam);

      // Domain Cổ hợp lệ = Đã index + Có ít nhất 1 snapshot trên Archive.org + Không dính spam + Score >= 50 + Giá mua <= 40$
      const isClean = d.indexed && !hasNoArchive && passes301 && passesLang && passesDeepAudit && (waybackScore >= 50) && (d.price <= 40) && (d.price <= filterConfig.maxPrice);

      return {
        ...d,
        archiveSnapshots,
        archiveFirstSeen,
        waybackSpamFlags,
        waybackScore: hasNoArchive ? 0 : waybackScore,
        waybackClean: !hasNoArchive && waybackClean,
        age: archiveFirstSeen > 0 ? 2026 - archiveFirstSeen : 0,
        status: isClean ? DomainStatus.Clean : DomainStatus.Penalized
      };
    });

    setDomains(finalDomains);
    setIsProcessing(false);
    setCurrentStep(Step.Output);
  };

  const domainUrlCounts = useMemo(() => {
    const counts = new Map<string, number>();
    domains.forEach(d => {
      const key = d.url.toLowerCase().trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [domains]);

  const cleanDomainsWithGrowth = useMemo(() => {
    return domains
      .filter(d => 
        d.status === DomainStatus.Clean && 
        d.price <= 40 &&
        d.price <= filterConfig.maxPrice &&
        d.archiveSnapshots >= 1 && 
        d.archiveFirstSeen > 0 && 
        !d.waybackSpamFlags.includes('No Wayback Archive Found') &&
        d.waybackScore >= 50
      )
      .map(d => {
        const growth = evaluateGrowthPotential(d);
        const key = d.url.toLowerCase().trim();
        const dupCount = domainUrlCounts.get(key) || 1;
        return {
          ...d,
          isDuplicate: dupCount > 1,
          duplicateCount: dupCount,
          growthPotentialScore: growth.score,
          isHighPotential: growth.isHighPotential,
          growthPotentialReasons: growth.reasons,
        };
      });
  }, [domains, domainUrlCounts]);

  const highPotentialCount = useMemo(() => {
    return cleanDomainsWithGrowth.filter(d => d.isHighPotential).length;
  }, [cleanDomainsWithGrowth]);

  const availableCount = useMemo(() => {
    return cleanDomainsWithGrowth.filter(d => d.liveAvailability === 'available').length;
  }, [cleanDomainsWithGrowth]);

  const viewDnsHistoryCount = useMemo(() => {
    return cleanDomainsWithGrowth.filter(d => d.viewDnsStatus === 'has_history').length;
  }, [cleanDomainsWithGrowth]);

  const duplicateDomainsCount = useMemo(() => {
    return cleanDomainsWithGrowth.filter(d => d.isDuplicate).length;
  }, [cleanDomainsWithGrowth]);

  const trafficDistributionData = useMemo(() => {
    let lowCount = 0;    // < 1,000
    let medCount = 0;    // 1,000 - 9,999
    let highCount = 0;   // >= 10,000

    let totalTrafficSum = 0;
    let maxTrafficVal = 0;

    cleanDomainsWithGrowth.forEach(d => {
      const t = d.traffic || 0;
      totalTrafficSum += t;
      if (t > maxTrafficVal) maxTrafficVal = t;

      if (t < 1000) {
        lowCount++;
      } else if (t < 10000) {
        medCount++;
      } else {
        highCount++;
      }
    });

    const total = cleanDomainsWithGrowth.length || 1;

    const chartData = [
      {
        name: 'Thấp (Low)',
        range: '< 1,000 visitors/tháng',
        value: lowCount,
        percentage: ((lowCount / total) * 100).toFixed(1),
        color: '#3b82f6',
        badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800',
      },
      {
        name: 'Trung Bình (Medium)',
        range: '1,000 - 9,999 visitors/tháng',
        value: medCount,
        percentage: ((medCount / total) * 100).toFixed(1),
        color: '#10b981',
        badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      },
      {
        name: 'Cao (High)',
        range: '≥ 10,000 visitors/tháng',
        value: highCount,
        percentage: ((highCount / total) * 100).toFixed(1),
        color: '#f59e0b',
        badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
      },
    ];

    const avgTrafficVal = Math.round(totalTrafficSum / (cleanDomainsWithGrowth.length || 1));

    return {
      chartData,
      totalClean: cleanDomainsWithGrowth.length,
      totalTrafficSum,
      maxTrafficVal,
      avgTrafficVal,
      lowCount,
      medCount,
      highCount,
    };
  }, [cleanDomainsWithGrowth]);

  const displayedDomains = useMemo(() => {
    let list = cleanDomainsWithGrowth;
    if (filterMode === 'high_potential') {
      list = list.filter(d => d.isHighPotential);
    } else if (filterMode === 'available_only') {
      list = list.filter(d => d.liveAvailability === 'available');
    } else if (filterMode === 'has_viewdns_history') {
      list = list.filter(d => d.viewDnsStatus === 'has_history');
    } else if (filterMode === 'duplicate_only') {
      list = list.filter(d => d.isDuplicate);
    }

    if (trafficFilter === 'low') {
      list = list.filter(d => (d.traffic || 0) < 1000);
    } else if (trafficFilter === 'medium') {
      list = list.filter(d => (d.traffic || 0) >= 1000 && (d.traffic || 0) < 10000);
    } else if (trafficFilter === 'high') {
      list = list.filter(d => (d.traffic || 0) >= 10000);
    }

    return list;
  }, [cleanDomainsWithGrowth, filterMode, trafficFilter]);
  
  const copySelectedDomains = async () => {
    const targetDomains = selectedIds.size > 0 
      ? displayedDomains.filter(d => selectedIds.has(d.id))
      : displayedDomains;

    if (targetDomains.length === 0) return;

    const textToCopy = targetDomains.map(d => d.url).join('\n');
    
    let success = false;
    try {
      await navigator.clipboard.writeText(textToCopy);
      success = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        success = true;
      } catch (e) {
        console.error(e);
      }
      document.body.removeChild(textarea);
    }

    if (success) {
      const msg = selectedIds.size > 0 
        ? `Đã sao chép ${targetDomains.length} tên miền đã chọn!` 
        : `Đã sao chép toàn bộ ${targetDomains.length} tên miền!`;
      setCopyToast(msg);
      addLog(`📋 ${msg}`);
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  const copySingleDomain = async (domainUrl: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let success = false;
    try {
      await navigator.clipboard.writeText(domainUrl);
      success = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = domainUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        success = true;
      } catch (err) {
        console.error(err);
      }
      document.body.removeChild(textarea);
    }

    if (success) {
      setSingleCopiedId(id);
      setCopyToast(`Đã sao chép domain "${domainUrl}"!`);
      setTimeout(() => setSingleCopiedId(null), 2000);
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  const checkSingleLiveDomain = async (domainId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = domains.find(d => d.id === domainId);
    if (!target) return;

    setDomains(prev => prev.map(d => d.id === domainId ? { ...d, liveAvailability: 'checking' } : d));

    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(target.url)}&type=A`, { 
        signal: AbortSignal.timeout(4500) 
      });
      
      let avail: 'available' | 'registered_active' | 'unknown' = 'unknown';
      let msg = 'Chưa xác định';

      if (dnsRes.ok) {
        const dnsData = await dnsRes.json();
        if (dnsData.Status === 3) {
          avail = 'available';
          msg = '🟢 DNS NXDOMAIN: Không có bản ghi A/DNS (Đã hết hạn & Tự do đăng ký)';
        } else if (dnsData.Status === 0 && dnsData.Answer && dnsData.Answer.length > 0) {
          const ips = dnsData.Answer.map((a: any) => a.data).slice(0, 2).join(', ');
          avail = 'registered_active';
          msg = `🔴 Active DNS (${ips}): Tên miền đang có IP hoạt động`;
        } else if (dnsData.Status === 2) {
          avail = 'available';
          msg = '🟢 DNS SERVFAIL: Máy chủ tên miền không hoạt động (Hết hạn)';
        } else {
          avail = 'available';
          msg = '🟢 Không tìm thấy DNS active (Khả năng cao tự do)';
        }
      }

      setDomains(prev => prev.map(d => d.id === domainId ? {
        ...d,
        liveAvailability: avail,
        dnsStatusMessage: msg
      } : d));

      if (avail === 'available') {
        setCopyToast(`✅ "${target.url}": Đã hết hạn, sẵn sàng mua!`);
        setTimeout(() => setCopyToast(null), 3000);
      } else if (avail === 'registered_active') {
        setCopyToast(`⚠️ "${target.url}": Đang có DNS active.`);
        setTimeout(() => setCopyToast(null), 3000);
      }

    } catch (err) {
      console.warn(err);
      setDomains(prev => prev.map(d => d.id === domainId ? {
        ...d,
        liveAvailability: 'unknown',
        dnsStatusMessage: '⚪ Cần kiểm tra trực tiếp qua Registrar WHOIS'
      } : d));
    }
  };

  const batchLiveCheckAvailability = async () => {
    const sourcePool = selectedIds.size > 0 
      ? cleanDomainsWithGrowth.filter(d => selectedIds.has(d.id))
      : cleanDomainsWithGrowth;

    if (sourcePool.length === 0) return;

    // Filter out domains that have already been scanned
    const targets = sourcePool.filter(d => !d.liveAvailability || d.liveAvailability === 'unknown');
    const alreadyScannedCount = sourcePool.length - targets.length;

    if (targets.length === 0) {
      addLog(`ℹ️ Tất cả ${sourcePool.length} domain đang có đã được quét Live DNS trước đó.`);
      setCopyToast(`ℹ️ Tất cả ${sourcePool.length} domain đã được quét Live DNS trước đó!`);
      setTimeout(() => setCopyToast(null), 3000);
      return;
    }

    setIsLiveChecking(true);
    if (alreadyScannedCount > 0) {
      addLog(`🔍 Bắt đầu quét Live DNS cho ${targets.length} domain chưa quét (Đã tự động bỏ qua ${alreadyScannedCount} domain đã quét trước đó trong tổng số ${sourcePool.length} domain)...`);
    } else {
      addLog(`🔍 Bắt đầu quét Live DNS cho tất cả ${targets.length} domain...`);
    }

    let availCount = 0;
    for (const target of targets) {
      setDomains(prev => prev.map(d => d.id === target.id ? { ...d, liveAvailability: 'checking' } : d));
      
      try {
        const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(target.url)}&type=A`, { 
          signal: AbortSignal.timeout(3500) 
        });
        if (dnsRes.ok) {
          const dnsData = await dnsRes.json();
          if (dnsData.Status === 3 || dnsData.Status === 2 || !dnsData.Answer) {
            availCount++;
            setDomains(prev => prev.map(d => d.id === target.id ? {
              ...d,
              liveAvailability: 'available',
              dnsStatusMessage: '🟢 DNS NXDOMAIN: Tự do / Đã hết hạn'
            } : d));
          } else {
            const ips = dnsData.Answer.map((a: any) => a.data).slice(0, 2).join(', ');
            setDomains(prev => prev.map(d => d.id === target.id ? {
              ...d,
              liveAvailability: 'registered_active',
              dnsStatusMessage: `🔴 Active DNS (${ips})`
            } : d));
          }
        }
      } catch {
        setDomains(prev => prev.map(d => d.id === target.id ? {
          ...d,
          liveAvailability: 'unknown',
          dnsStatusMessage: '⚪ Kiểm tra trực tiếp tại sàn'
        } : d));
      }

      await new Promise(r => setTimeout(r, 120));
    }

    setIsLiveChecking(false);
    if (availCount > 0) {
      setFilterMode('available_only');
      addLog(`✅ Hoàn tất kiểm tra Live DNS! Phát hiện ${availCount}/${targets.length} domain tự do (NXDOMAIN). Tự động lọc danh sách chỉ hiển thị domain đã hết hạn.`);
      setCopyToast(`🟢 Tự động lọc chỉ hiển thị ${availCount} domain đã hết hạn (Sẵn sàng mua)!`);
    } else {
      addLog(`✅ Hoàn tất kiểm tra Live DNS! Đã kiểm tra xong ${targets.length} domain.`);
      setCopyToast(`✅ Đã kiểm tra xong ${targets.length} domain!`);
    }
    setTimeout(() => setCopyToast(null), 3500);
  };

  const fetchViewDnsResult = async (domainUrl: string) => {
    // 1. Try server endpoint first (which checks ViewDNS + Web Archive + RDAP WHOIS + Google DNS)
    try {
      const res = await fetch('/api/check-viewdns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainUrl }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.hasHistory) {
          return {
            hasHistory: true,
            recordCount: data.recordCount || 1,
            msg: data.message || '🟢 Có lịch sử IP'
          };
        }
      }
    } catch (e) {
      console.warn("Server ViewDNS API failed, trying client fallback:", e);
    }

    // 2. Client-side fallback via Web Archive CDX & Google DNS
    try {
      const clean = domainUrl.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      let archiveCount = 0;
      let activeIpCount = 0;

      try {
        const arcRes = await fetch(`https://web.archive.org/cdx/search/cdx?url=${clean}&output=json&fl=timestamp&limit=50`, { signal: AbortSignal.timeout(4000) });
        if (arcRes.ok) {
          const json = await arcRes.json();
          if (Array.isArray(json) && json.length > 1) archiveCount = json.length - 1;
        }
      } catch (e) {}

      try {
        const gRes = await fetch(`https://dns.google/resolve?name=${clean}&type=A`, { signal: AbortSignal.timeout(3000) });
        if (gRes.ok) {
          const json = await gRes.json();
          if (json?.Answer) {
            activeIpCount = json.Answer.filter((a: any) => a.type === 1).length;
          }
        }
      } catch (e) {}

      if (archiveCount > 0 || activeIpCount > 0) {
        const recs = archiveCount > 0 ? Math.max(1, Math.min(10, Math.ceil(archiveCount / 3))) : activeIpCount;
        return {
          hasHistory: true,
          recordCount: recs,
          msg: `🟢 Có ${recs}+ bản ghi lịch sử (${archiveCount} Web Archive snapshots)`
        };
      }
    } catch (err) {
      console.warn("Client DNS fallback failed:", err);
    }

    const parts = domainUrl.split('.');
    if (parts.length > 2 && !['com.vn', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn', 'co.uk', 'org.uk', 'com.au'].some(suffix => domainUrl.endsWith(suffix))) {
      return {
        hasHistory: false,
        recordCount: 0,
        msg: '🔴 ViewDNS: Không hỗ trợ subdomain'
      };
    }

    return {
      hasHistory: false,
      recordCount: 0,
      msg: '🔴 ViewDNS: Không tìm thấy dữ liệu lịch sử'
    };
  };

  const checkSingleViewDnsHistory = async (domainId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = domains.find(d => d.id === domainId);
    if (!target) return;

    setDomains(prev => prev.map(d => d.id === domainId ? { ...d, viewDnsStatus: 'checking' } : d));

    try {
      const result = await fetchViewDnsResult(target.url);
      const status = result.hasHistory ? 'has_history' : 'no_history';

      setDomains(prev => prev.map(d => d.id === domainId ? {
        ...d,
        viewDnsStatus: status,
        viewDnsIPCount: result.recordCount,
        viewDnsMessage: result.msg
      } : d));

      setCopyToast(result.msg);
      setTimeout(() => setCopyToast(null), 3000);

    } catch (err) {
      console.error(err);
      setDomains(prev => prev.map(d => d.id === domainId ? {
        ...d,
        viewDnsStatus: 'no_history',
        viewDnsMessage: '🔴 Không có dữ liệu lịch sử ViewDNS'
      } : d));
    }
  };

  const batchCheckViewDnsHistory = async () => {
    const sourcePool = selectedIds.size > 0 
      ? cleanDomainsWithGrowth.filter(d => selectedIds.has(d.id))
      : cleanDomainsWithGrowth;

    if (sourcePool.length === 0) return;

    // Filter out domains that have already been scanned for ViewDNS
    const targets = sourcePool.filter(d => !d.viewDnsStatus || d.viewDnsStatus === 'unknown');
    const alreadyScannedCount = sourcePool.length - targets.length;

    if (targets.length === 0) {
      addLog(`ℹ️ Tất cả ${sourcePool.length} domain đang có đã được quét ViewDNS trước đó.`);
      setCopyToast(`ℹ️ Tất cả ${sourcePool.length} domain đã được quét ViewDNS trước đó!`);
      setTimeout(() => setCopyToast(null), 3000);
      return;
    }

    setIsViewDnsChecking(true);
    if (alreadyScannedCount > 0) {
      addLog(`🔎 Bắt đầu quét lịch sử ViewDNS IP History cho ${targets.length} domain chưa quét (Đã tự động bỏ qua ${alreadyScannedCount} domain đã quét trước đó trong tổng số ${sourcePool.length} domain)...`);
    } else {
      addLog(`🔎 Bắt đầu tự động kiểm tra lịch sử ViewDNS IP History cho ${targets.length} domain...`);
    }

    let historyCount = 0;
    let excludedCount = 0;

    for (const target of targets) {
      setDomains(prev => prev.map(d => d.id === target.id ? { ...d, viewDnsStatus: 'checking' } : d));

      const result = await fetchViewDnsResult(target.url);

      if (result.hasHistory) {
        historyCount++;
        setDomains(prev => prev.map(d => d.id === target.id ? {
          ...d,
          viewDnsStatus: 'has_history',
          viewDnsIPCount: result.recordCount,
          viewDnsMessage: result.msg
        } : d));
      } else {
        excludedCount++;
        setDomains(prev => prev.map(d => d.id === target.id ? {
          ...d,
          viewDnsStatus: 'no_history',
          viewDnsMessage: result.msg
        } : d));
      }

      await new Promise(r => setTimeout(r, 150));
    }

    setIsViewDnsChecking(false);

    if (historyCount > 0) {
      setFilterMode('has_viewdns_history');
      addLog(`✅ Hoàn tất ViewDNS! Phát hiện ${historyCount} domain có lịch sử IP. Đã loại ${excludedCount} domain không có dữ liệu trên ViewDNS.`);
      setCopyToast(`🟢 Lọc danh sách: ${historyCount} domain CÓ LỊCH SỬ ViewDNS (Đã loại ${excludedCount} domain không có lịch sử)!`);
    } else {
      addLog(`⚠️ Đã kiểm tra xong ${targets.length} domain. Tất cả đều không có dữ liệu lịch sử trên ViewDNS.`);
      setCopyToast(`⚠️ Đã kiểm tra: 0 domain có lịch sử IP trên ViewDNS (Đã loại ${targets.length} domain)`);
    }
    setTimeout(() => setCopyToast(null), 4000);
  };

  const deleteSingleDomain = (domainId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = domains.find(d => d.id === domainId);
    setDomains(prev => prev.filter(d => d.id !== domainId));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(domainId);
      return next;
    });
    if (target) {
      addLog(`🗑️ Đã xóa tên miền: ${target.url}`);
    }
    setCopyToast("🗑️ Đã xóa tên miền khỏi danh sách!");
    setTimeout(() => setCopyToast(null), 2000);
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setDomains(prev => prev.filter(d => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
    addLog(`🗑️ Đã xóa thành công ${count} tên miền đã chọn.`);
    setCopyToast(`🗑️ Đã xóa thành công ${count} tên miền đã chọn!`);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const removeDuplicateDomains = () => {
    const seen = new Set<string>();
    let removedCount = 0;
    setDomains(prev => {
      const filtered: DomainEntity[] = [];
      for (const d of prev) {
        const key = d.url.toLowerCase().trim();
        if (seen.has(key)) {
          removedCount++;
        } else {
          seen.add(key);
          filtered.push(d);
        }
      }
      return filtered;
    });

    if (removedCount > 0) {
      if (filterMode === 'duplicate_only') {
        setFilterMode('all');
      }
      addLog(`🧹 Đã tự động lọc và xóa ${removedCount} tên miền trùng lặp, chỉ giữ lại các bản duy nhất.`);
      setCopyToast(`🧹 Đã xóa ${removedCount} tên miền trùng lặp khỏi danh sách!`);
    } else {
      setCopyToast("✨ Danh sách sạch, không có tên miền nào bị trùng lặp!");
    }
    setTimeout(() => setCopyToast(null), 3000);
  };

  const exportToCSV = () => {
    const headers = ["Domain", "DR", "RD", "TF", "Current Traffic", "Projected M6 Traffic", "Price", "SEO Difficulty Score", "SEO Difficulty Level", "Keyword Density (%)", "Marketplace", "Status", "Growth Score", "High Potential", "Reasons"];
    const rows = displayedDomains.map(d => {
      const currentTraffic = d.traffic || 0;
      const dr = d.dr || 0;
      const rd = d.rd || 0;
      const score = d.growthPotentialScore || 50;
      const baseVal = Math.max(currentTraffic, Math.round((dr * 12 + rd * 3 + score * 4)));
      const growthRate = 0.08 + (score / 100) * 0.18 + (dr > 30 ? 0.08 : dr > 15 ? 0.04 : 0.01);
      const projectedM6 = Math.round(baseVal * (1 + growthRate * 4.0));
      const seoDiff = calculateSEODifficulty(d);

      return [
        d.url, 
        d.dr, 
        d.rd,
        d.tf, 
        d.traffic, 
        projectedM6,
        d.price, 
        seoDiff.score,
        seoDiff.level,
        `${seoDiff.keywordDensity}%`,
        d.marketplace, 
        d.isAuction ? 'Auction' : 'Registry',
        d.growthPotentialScore || 0,
        d.isHighPotential ? 'Yes' : 'No',
        `"${(d.growthPotentialReasons || []).join('; ')}"`
      ];
    });
    let csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `pbn_hunter_clean_domains_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case Step.Crawl:
        return (
          <div className="max-w-3xl mx-auto mt-10 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-white"><Database className="text-blue-500"/> Thu thập PBN</h2>
             <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Từ khóa chủ đề</label>
                    <input type="text" value={seedKeyword} onChange={e => setSeedKeyword(e.target.value)} className="w-full bg-slate-950 p-5 rounded-2xl border border-slate-800 outline-none text-lg font-bold text-white focus:border-blue-500 transition-all shadow-inner" placeholder="VD: marketing, casino, travel..."/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Giới hạn quét</label>
                    <select value={scanLimit} onChange={e => setScanLimit(Number(e.target.value))} className="w-full bg-slate-950 p-5 rounded-2xl border border-slate-800 outline-none font-bold text-white cursor-pointer hover:border-slate-600 transition-colors">
                      <option value={100}>100 Domain</option>
                      <option value={1000}>1,000 Domain</option>
                      <option value={10000}>10,000 Domain</option>
                      <option value={50000}>50,000 Domain</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-500 block uppercase tracking-widest">Bổ sung đuôi (TLD)</label>
                      <button 
                        type="button"
                        onClick={() => setShowBulkTldModal(true)} 
                        className="text-[11px] font-extrabold text-blue-400 hover:text-white flex items-center gap-1.5 transition-all bg-blue-950/70 hover:bg-blue-600 px-3 py-1 rounded-xl border border-blue-800/80 hover:border-blue-500 shadow-md"
                      >
                        <Layers size={13} /> Thêm Hàng Loạt
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customTld} 
                        onChange={e => setCustomTld(e.target.value)} 
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customTld.trim()) {
                              const formatted = customTld.trim().startsWith('.') ? customTld.trim() : '.' + customTld.trim();
                              if (!availableTlds.includes(formatted)) {
                                setAvailableTlds([...availableTlds, formatted]);
                              }
                              setCustomTld("");
                            }
                          }
                        }}
                        placeholder=".vn, .jp, .app" 
                        className="flex-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 outline-none font-bold text-white focus:border-blue-500 transition-all shadow-inner"
                      />
                      <button 
                        type="button"
                        onClick={() => { 
                          if (customTld.trim()) { 
                            const formatted = customTld.trim().startsWith('.') ? customTld.trim() : '.' + customTld.trim();
                            if (!availableTlds.includes(formatted)) {
                              setAvailableTlds([...availableTlds, formatted]);
                            }
                            setCustomTld(""); 
                          } 
                        }} 
                        className="bg-blue-600 p-5 rounded-2xl border border-blue-500 hover:bg-blue-500 hover:scale-105 transition-all text-white flex items-center justify-center"
                        title="Thêm TLD"
                      >
                        <Plus size={20}/>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                   <label className="text-[10px] font-black text-slate-600 mb-3 block uppercase tracking-[0.2em]">Danh sách TLD đang quét:</label>
                   <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                      {availableTlds.map(t => (
                        <div key={t} className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-2 group">
                           {t}
                           {!INITIAL_TLDS.includes(t) && (
                             <button onClick={() => removeTld(t)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                           )}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <button 
                     onClick={() => startCrawl(false)} 
                     disabled={isProcessing} 
                     className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[2rem] font-black text-xl text-white flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                   >
                       {isProcessing ? <RefreshCw className="animate-spin"/> : <Zap/>} BẮT ĐẦU TRUY QUÉT HỆ THỐNG
                       <span className="ml-auto text-xs bg-slate-950/60 border border-white/20 px-3 py-1.5 rounded-xl font-mono text-slate-200 font-normal flex items-center gap-1.5 hidden sm:flex">
                         <kbd className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">Ctrl</kbd> + <kbd className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">Enter</kbd>
                       </span>
                   </button>
                   <p className="text-center text-[11px] text-slate-500 font-medium">
                     💡 Phím tắt toàn cục: Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-[10px]">Ctrl + Enter</kbd> (hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-[10px]">⌘ + Enter</kbd>) từ bất kỳ màn hình nào để kích hoạt nhanh quét hệ thống.
                   </p>
                </div>
             </div>
          </div>
        );
      case Step.Filter:
        return (
            <div className="max-w-2xl mx-auto mt-6 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl">
                <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-emerald-500"><Filter/> Cấu hình SEO & Ngân sách</h3>
                <FilterControl label="Domain Rating (DR)" min={0} max={100} value={filterConfig.minDR} onChange={v => setFilterConfig({...filterConfig, minDR: v})}/>
                <FilterControl label="Trust Flow (TF)" min={0} max={100} value={filterConfig.minTF} onChange={v => setFilterConfig({...filterConfig, minTF: v})}/>
                <FilterControl 
                  label="Ngân sách mua tối đa ($)" 
                  min={5} 
                  max={100} 
                  value={filterConfig.maxPrice} 
                  onChange={v => setFilterConfig({...filterConfig, maxPrice: v})} 
                  colorClass="bg-emerald-500"
                  description="⚠️ Quy tắc duyệt: Tên miền có giá mua vượt quá 40$ sẽ KHÔNG bao giờ được duyệt vào danh sách Clean"
                />
                
                <div className="mt-8 bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest flex items-center gap-2">
                    <History className="text-blue-400" size={16}/> Thuật toán lọc Wayback Machine (web.archive.org)
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group p-3.5 bg-blue-950/70 hover:bg-blue-900/70 rounded-2xl border border-blue-700/80 transition-colors shadow-lg shadow-blue-950/40">
                    <div>
                      <span className="text-sm font-black text-blue-200 group-hover:text-white transition-colors flex items-center gap-2">
                        <History size={18} className="text-blue-400 animate-pulse"/> Loại bỏ domain không có lịch sử web.archive.org
                      </span>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Tự động <b>loại bỏ hoàn toàn</b> các tên miền báo lỗi <span className="text-amber-300 font-mono">"Wayback Machine has not archived that URL"</span> hoặc <span className="text-amber-300 font-mono">"No URLs captured"</span> (0 Snapshots).
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={filterConfig.requireArchiveHistory} 
                      onChange={e => setFilterConfig({...filterConfig, requireArchiveHistory: e.target.checked})} 
                      className="accent-blue-500 w-5 h-5 cursor-pointer rounded flex-shrink-0 ml-3"
                    />
                  </label>

                  <FilterControl 
                    label="Snapshots Archive.org tối thiểu" 
                    min={1} 
                    max={100} 
                    value={filterConfig.minArchiveSnapshots} 
                    onChange={v => setFilterConfig({...filterConfig, minArchiveSnapshots: v})}
                    description="Loại bỏ domain có quá ít bản lưu vết trên Archive.org"
                  />

                  <FilterControl 
                    label="Năm xuất hiện lần đầu (First Seen) tối đa" 
                    min={2005} 
                    max={2024} 
                    value={filterConfig.maxArchiveFirstSeenYear} 
                    onChange={v => setFilterConfig({...filterConfig, maxArchiveFirstSeenYear: v})}
                    description="Yêu cầu domain phải có lịch sử tồn tại lâu đời trước năm lựa chọn"
                  />

                  <div className="pt-2 border-t border-slate-800/80 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-900/60 hover:bg-slate-900 rounded-2xl border border-slate-800 transition-colors">
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-400"/> Lọc 301 Redirect & Parked Domain Spam
                      </span>
                      <input 
                        type="checkbox" 
                        checked={filterConfig.excludeWayback301Spam} 
                        onChange={e => setFilterConfig({...filterConfig, excludeWayback301Spam: e.target.checked})} 
                        className="accent-emerald-500 w-5 h-5 cursor-pointer rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-900/60 hover:bg-slate-900 rounded-2xl border border-slate-800 transition-colors">
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                        <Globe size={16} className="text-purple-400"/> Lọc Đổi Ngôn Ngữ Bất Thường (Chinese/Japanese Gambling)
                      </span>
                      <input 
                        type="checkbox" 
                        checked={filterConfig.excludeWaybackForeignLanguageSpam} 
                        onChange={e => setFilterConfig({...filterConfig, excludeWaybackForeignLanguageSpam: e.target.checked})} 
                        className="accent-emerald-500 w-5 h-5 cursor-pointer rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-900/60 hover:bg-slate-900 rounded-2xl border border-slate-800 transition-colors">
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                        <Bug size={16} className="text-blue-400"/> Kích hoạt Deep Wayback Audit (Phát hiện Footprint PBN)
                      </span>
                      <input 
                        type="checkbox" 
                        checked={filterConfig.enableDeepWaybackAudit} 
                        onChange={e => setFilterConfig({...filterConfig, enableDeepWaybackAudit: e.target.checked})} 
                        className="accent-emerald-500 w-5 h-5 cursor-pointer rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-900/60 hover:bg-slate-900 rounded-2xl border border-slate-800 transition-colors">
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                        <XCircle size={18} className="text-red-400"/> Loại bỏ toàn bộ domain chứa dấu gạch ngang (-)
                      </span>
                      <input 
                        type="checkbox" 
                        checked={filterConfig.excludeHyphenDomains} 
                        onChange={e => setFilterConfig({...filterConfig, excludeHyphenDomains: e.target.checked})} 
                        className="accent-emerald-500 w-5 h-5 cursor-pointer rounded"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-8 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-500 mb-4 block uppercase tracking-widest">Sàn giao dịch hỗ trợ</label>
                  <div className="flex gap-8">
                    {['SAV', 'Namecheap', 'Registry'].map((market) => (
                        <label key={market} className="flex items-center gap-3 cursor-pointer group">
                            <div onClick={() => setAllowedMarketplaces(prev => prev.includes(market as any) ? prev.filter(m => m !== market) : [...prev, market as any])}
                                className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${allowedMarketplaces.includes(market as any) ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-800 border-slate-700'}`}>
                                {allowedMarketplaces.includes(market as any) && <CheckSquare size={18} className="text-white"/>}
                            </div>
                            <span className="text-sm font-black text-slate-400 group-hover:text-white transition-colors">{market}</span>
                        </label>
                    ))}
                  </div>
                </div>
                
                <button onClick={applyFilters} className="w-full bg-emerald-600 p-6 rounded-[2rem] font-black text-white mt-12 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95">XÁC NHẬN & CHẠY BỘ LỌC WAYBACK</button>
            </div>
        );
      case Step.PenaltyCheck:
        return (
            <div className="max-w-2xl mx-auto mt-20 p-12 bg-slate-900 border border-slate-800 rounded-[3rem] text-center shadow-2xl">
                <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-[0_0_50px_rgba(37,99,235,0.2)]"><ShieldCheck className="text-blue-500" size={48}/></div>
                <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Penalty & Quality Audit</h2>
                <p className="text-slate-400 mb-10 font-medium">Đang kiểm tra chỉ số index Google, quét mã độc Safe Browsing và lọc lịch sử Archive bẩn...</p>
                <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-[progress_2s_linear_infinite]" style={{width: '75%', backgroundSize: '200% 100%'}}></div>
                </div>
                <p className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Deep Scanning Engine v2.0</p>
            </div>
        );
      case Step.Output:
        return (
          <div className="p-8 max-w-[1900px] mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10 bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-800 backdrop-blur-xl shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter flex flex-wrap items-center gap-3">
                      Inventory Sạch ({cleanDomainsWithGrowth.length.toLocaleString()})
                      {highPotentialCount > 0 && (
                        <span className="text-xs px-3 py-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-amber-300 border border-amber-500/50 rounded-full font-extrabold flex items-center gap-1.5 animate-pulse shadow-md">
                          <Flame size={14} className="fill-amber-400 text-amber-400"/>
                          {highPotentialCount} High Potential
                        </span>
                      )}
                    </h2>
                    <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500"/> Đã qua bộ lọc AI & Technical Audit
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        onClick={() => setFilterMode('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                          filterMode === 'all' 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40' 
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 size={14}/> Tất cả ({cleanDomainsWithGrowth.length.toLocaleString()})
                      </button>

                      <button
                        onClick={() => setFilterMode('high_potential')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                          filterMode === 'high_potential' 
                            ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border-amber-400 shadow-lg shadow-amber-900/50 scale-105' 
                            : 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                        }`}
                      >
                        <Flame size={15} className="text-amber-400 animate-pulse fill-amber-400"/>
                        <span>🔥 High Potential ({highPotentialCount.toLocaleString()})</span>
                      </button>

                      <button
                        onClick={() => setFilterMode('available_only')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                          filterMode === 'available_only' 
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50 scale-105' 
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                        }`}
                      >
                        <CheckCircle2 size={15} className="text-emerald-400"/>
                        <span>🟢 Chỉ Domain Đã Hết Hạn ({availableCount.toLocaleString()})</span>
                      </button>

                      <button
                        onClick={() => setFilterMode('has_viewdns_history')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                          filterMode === 'has_viewdns_history' 
                            ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-900/50 scale-105' 
                            : 'bg-purple-950/40 text-purple-300 border-purple-800/80 hover:bg-purple-900/60'
                        }`}
                      >
                        <Server size={15} className="text-purple-400"/>
                        <span>🌐 Có Lịch Sử ViewDNS ({viewDnsHistoryCount.toLocaleString()})</span>
                      </button>

                      {duplicateDomainsCount > 0 && (
                        <button
                          onClick={() => setFilterMode('duplicate_only')}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                            filterMode === 'duplicate_only' 
                              ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-900/50 scale-105' 
                              : 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                          }`}
                        >
                          <Layers size={15} className="text-amber-400"/>
                          <span>⚠️ Trùng Lặp ({duplicateDomainsCount.toLocaleString()})</span>
                        </button>
                      )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    {duplicateDomainsCount > 0 && (
                      <button 
                        onClick={removeDuplicateDomains} 
                        className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-amber-900/40 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 animate-bounce"
                        title="Tự động lọc và xóa bỏ các bản trùng lặp trong danh sách, chỉ giữ lại 1 bản duy nhất"
                      >
                        <Layers size={20}/>
                        <span>Lọc Bỏ Trùng Lặp ({duplicateDomainsCount})</span>
                      </button>
                    )}
                    <button 
                      onClick={batchCheckViewDnsHistory} 
                      disabled={isViewDnsChecking || displayedDomains.length === 0} 
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-purple-900/40 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      title="Tự động quét tất cả domain chưa kiểm tra lịch sử IP ViewDNS (bỏ qua các domain đã được quét)"
                    >
                      {isViewDnsChecking ? <Loader2 size={20} className="animate-spin"/> : <Server size={20}/>}
                      <span>{isViewDnsChecking ? 'Đang check ViewDNS...' : 'Check Lịch Sử ViewDNS'}</span>
                    </button>
                    <button 
                      onClick={batchLiveCheckAvailability} 
                      disabled={isLiveChecking || displayedDomains.length === 0} 
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-cyan-900/40 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      title="Quét trực tiếp bản ghi Live DNS cho tất cả domain đang có (bỏ qua các domain đã được quét trước đó)"
                    >
                      {isLiveChecking ? <Loader2 size={20} className="animate-spin"/> : <Search size={20}/>}
                      <span>{isLiveChecking ? 'Đang check DNS...' : 'Check Live Hết Hạn'}</span>
                    </button>
                    <button onClick={resetTool} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black border border-slate-700 flex items-center gap-3 transition-all hover:scale-105">
                        <RotateCcw size={20}/> Quét lại
                    </button>
                    <button onClick={() => startCrawl(true)} disabled={isProcessing} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-6 py-4 rounded-2xl font-black border border-blue-500/30 flex items-center gap-3 transition-all hover:scale-105">
                        {isProcessing ? <Loader2 size={20} className="animate-spin"/> : <PlusCircle size={20}/>} Quét thêm
                    </button>
                    <button 
                      onClick={copySelectedDomains} 
                      disabled={displayedDomains.length === 0} 
                      className={`px-6 py-4 rounded-2xl font-black border flex items-center gap-3 transition-all ${
                        selectedIds.size > 0 
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-900/40 hover:scale-105 active:scale-95' 
                          : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80 hover:scale-105'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={selectedIds.size > 0 ? `Sao chép ${selectedIds.size} domain đã chọn` : `Sao chép toàn bộ ${displayedDomains.length} domain`}
                    >
                      <Copy size={20}/>
                      <span>
                        {selectedIds.size > 0 
                          ? `Sao chép đã chọn (${selectedIds.size})` 
                          : `Sao chép tất cả (${displayedDomains.length})`}
                      </span>
                    </button>
                    <button onClick={deleteSelected} disabled={selectedIds.size === 0} className={`px-6 py-4 rounded-2xl font-black border flex items-center gap-3 transition-all ${selectedIds.size > 0 ? 'bg-red-900/20 text-red-400 border-red-900/50 shadow-lg shadow-red-900/20 hover:scale-105' : 'bg-slate-800/40 text-slate-700 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                        <Trash2 size={20}/> Xóa ({selectedIds.size})
                    </button>
                    <button onClick={exportToCSV} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-900/40 flex items-center gap-3 hover:bg-indigo-500 transition-all hover:scale-105">
                        <Download size={20}/> Xuất CSV
                    </button>
                </div>
            </div>

            {/* NEW SECTION: Traffic Volume Distribution Recharts Pie Chart */}
            <div className="mb-10 bg-slate-900/80 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <PieChartIcon className="text-emerald-400" size={24} />
                    <span>Phân Phối Lưu Lượng Traffic (Traffic Volume Distribution)</span>
                  </h3>
                  <p className="text-slate-400 text-xs font-medium mt-1">
                    Trực quan hóa cơ cấu phân bổ lưu lượng truy cập hàng tháng (Thấp, Trung Bình, Cao) trên toàn bộ {trafficDistributionData.totalClean.toLocaleString()} domain sạch
                  </p>
                </div>

                {/* Filter buttons by Traffic volume */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc theo Traffic:</span>
                  <button
                    onClick={() => setTrafficFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      trafficFilter === 'all'
                        ? 'bg-slate-700 text-white border-slate-500 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Tất cả ({trafficDistributionData.totalClean})
                  </button>
                  <button
                    onClick={() => setTrafficFilter(trafficFilter === 'low' ? 'all' : 'low')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      trafficFilter === 'low'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/50 scale-105'
                        : 'bg-blue-950/40 text-blue-300 border-blue-800/60 hover:bg-blue-900/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>Thấp ({trafficDistributionData.lowCount})</span>
                  </button>
                  <button
                    onClick={() => setTrafficFilter(trafficFilter === 'medium' ? 'all' : 'medium')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      trafficFilter === 'medium'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50 scale-105'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Trung bình ({trafficDistributionData.medCount})</span>
                  </button>
                  <button
                    onClick={() => setTrafficFilter(trafficFilter === 'high' ? 'all' : 'high')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      trafficFilter === 'high'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-900/50 scale-105'
                        : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Cao ({trafficDistributionData.highCount})</span>
                  </button>
                </div>
              </div>

              {trafficDistributionData.totalClean === 0 ? (
                <div className="py-12 text-center text-slate-500 font-bold">
                  Chưa có dữ liệu domain sạch để hiển thị biểu đồ phân bổ.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Recharts Pie / Donut Chart */}
                  <div className="lg:col-span-6 xl:col-span-5 h-[280px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trafficDistributionData.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          stroke="#0f172a"
                          strokeWidth={3}
                          onClick={(data) => {
                            if (data && data.name) {
                              if (data.name.includes('Thấp')) setTrafficFilter(trafficFilter === 'low' ? 'all' : 'low');
                              if (data.name.includes('Trung')) setTrafficFilter(trafficFilter === 'medium' ? 'all' : 'medium');
                              if (data.name.includes('Cao')) setTrafficFilter(trafficFilter === 'high' ? 'all' : 'high');
                            }
                          }}
                          className="cursor-pointer outline-none"
                        >
                          {trafficDistributionData.chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              opacity={
                                trafficFilter === 'all' 
                                  ? 1 
                                  : (
                                      (trafficFilter === 'low' && entry.name.includes('Thấp')) ||
                                      (trafficFilter === 'medium' && entry.name.includes('Trung')) ||
                                      (trafficFilter === 'high' && entry.name.includes('Cao'))
                                    ) ? 1 : 0.35
                              }
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTrafficTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-white">{trafficDistributionData.totalClean}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Domains</span>
                    </div>
                  </div>

                  {/* Right: Category Cards & Metrics */}
                  <div className="lg:col-span-6 xl:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trafficDistributionData.chartData.map((cat, idx) => {
                      const isFilterActive = 
                        (trafficFilter === 'low' && cat.name.includes('Thấp')) ||
                        (trafficFilter === 'medium' && cat.name.includes('Trung')) ||
                        (trafficFilter === 'high' && cat.name.includes('Cao'));

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (cat.name.includes('Thấp')) setTrafficFilter(trafficFilter === 'low' ? 'all' : 'low');
                            if (cat.name.includes('Trung')) setTrafficFilter(trafficFilter === 'medium' ? 'all' : 'medium');
                            if (cat.name.includes('Cao')) setTrafficFilter(trafficFilter === 'high' ? 'all' : 'high');
                          }}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                            isFilterActive
                              ? 'bg-slate-950 border-slate-500 shadow-xl scale-[1.02]'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${cat.badgeBg}`}>
                              {cat.name}
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                          </div>

                          <div className="text-2xl font-black text-white font-mono">
                            {cat.value.toLocaleString()} <span className="text-xs font-normal text-slate-400">domain</span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-900">
                            <span>Tỷ lệ:</span>
                            <b className="text-white font-mono">{cat.percentage}%</b>
                          </div>

                          <div className="text-[10px] text-slate-500 mt-1 truncate" title={cat.range}>
                            {cat.range}
                          </div>
                        </div>
                      );
                    })}

                    {/* Overall Metrics Bar */}
                    <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Traffic TB / Domain</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          ~{trafficDistributionData.avgTrafficVal.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">/tháng</span>
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Traffic Cao Nhất</span>
                        <span className="text-base font-black text-amber-400 font-mono">
                          {trafficDistributionData.maxTrafficVal.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">/tháng</span>
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Tổng Traffic Tích Lũy</span>
                        <span className="text-base font-black text-blue-400 font-mono">
                          {trafficDistributionData.totalTrafficSum >= 1000000 
                            ? `${(trafficDistributionData.totalTrafficSum / 1000000).toFixed(2)}M` 
                            : `${(trafficDistributionData.totalTrafficSum / 1000).toFixed(1)}k`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-slate-950/90 text-slate-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-20">
                            <th className="p-6 border-b border-slate-800 w-10 text-center"><input type="checkbox" checked={selectedIds.size === displayedDomains.length && displayedDomains.length > 0} onChange={() => setSelectedIds(new Set(selectedIds.size === displayedDomains.length ? [] : displayedDomains.map(d => d.id)))} className="accent-blue-500 w-5 h-5 cursor-pointer rounded"/></th>
                            <th className="p-6 border-b border-slate-800">Domain & SEO Metrics</th>
                            <th className="p-6 border-b border-slate-800">Độ khó SEO</th>
                            <th className="p-6 border-b border-slate-800">Sàn & Trạng thái</th>
                            <th className="p-6 border-b border-slate-800">Giá ($)</th>
                            <th className="p-6 border-b border-slate-800">Archive Info</th>
                            <th className="p-6 border-b border-slate-800">Tiềm Năng Tăng Trưởng</th>
                            <th className="p-6 border-b border-slate-800 text-center">Safety Checks</th>
                            <th className="p-6 border-b border-slate-800 text-right">Mua</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {displayedDomains.slice(0, 1000).map((d) => (
                            <tr key={d.id} className={`hover:bg-blue-600/5 transition-all group ${d.isDuplicate ? 'bg-amber-950/25 border-l-4 border-l-amber-500' : ''} ${selectedIds.has(d.id) ? 'bg-blue-900/20' : ''}`}>
                                <td className="p-6 text-center"><input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => {
                                    const next = new Set(selectedIds);
                                    if(next.has(d.id)) next.delete(d.id); else next.add(d.id);
                                    setSelectedIds(next);
                                }} className="accent-blue-500 w-5 h-5 cursor-pointer rounded transition-transform group-hover:scale-110"/></td>
                                <td className="p-6">
                                    <div className="font-black text-white text-xl group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                        <span>{d.url}</span>
                                        <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0"/>
                                        <button 
                                          onClick={(e) => copySingleDomain(d.url, d.id, e)}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-bold shadow-md"
                                          title="Sao chép tên miền này"
                                        >
                                          {singleCopiedId === d.id ? <CheckCircle2 size={13} className="text-emerald-300"/> : <Copy size={13}/>}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      {d.isDuplicate && (
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-700/80 flex items-center gap-1 shadow-md" title={`Tên miền bị trùng lặp ${d.duplicateCount} lần trong danh sách`}>
                                          <Layers size={11} className="text-amber-400"/> Trùng lặp ({d.duplicateCount}x)
                                        </span>
                                      )}
                                      {d.isHighPotential && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/50">
                                          <Flame size={12} className="text-amber-400 fill-amber-400 animate-pulse"/>
                                          High Potential
                                        </span>
                                      )}
                                      {d.liveAvailability === 'checking' ? (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1 animate-pulse">
                                          <Loader2 size={11} className="animate-spin"/> Live Checking...
                                        </span>
                                      ) : d.liveAvailability === 'available' ? (
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1" title={d.dnsStatusMessage}>
                                          <CheckCircle2 size={12} className="text-emerald-400"/> Đã hết hạn (NXDOMAIN)
                                        </span>
                                      ) : d.liveAvailability === 'registered_active' ? (
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-red-950/80 text-red-300 border border-red-800 flex items-center gap-1" title={d.dnsStatusMessage}>
                                          <XCircle size={12} className="text-red-400"/> Active DNS
                                        </span>
                                      ) : (
                                        <button 
                                          onClick={(e) => checkSingleLiveDomain(d.id, e)}
                                          className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 flex items-center gap-1 transition-all"
                                          title="Bấm để kiểm tra trực tiếp DNS/WHOIS xem domain có thực sự hết hạn không"
                                        >
                                          <Search size={11}/> Check Live Mua
                                        </button>
                                      )}

                                      {d.viewDnsStatus === 'checking' ? (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 animate-pulse">
                                          <Loader2 size={11} className="animate-spin"/> ViewDNS Checking...
                                        </span>
                                      ) : d.viewDnsStatus === 'has_history' ? (
                                        <a 
                                          href={`https://viewdns.info/iphistory/?domain=${d.url}`} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 hover:bg-purple-900 transition-all" 
                                          title={d.viewDnsMessage || 'Đã xác minh có lịch sử IP trên ViewDNS'}
                                        >
                                          <Server size={11} className="text-purple-400"/> ViewDNS ({d.viewDnsIPCount || 1}+ IP History)
                                        </a>
                                      ) : d.viewDnsStatus === 'no_history' ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-red-950/80 text-red-300 border border-red-800 flex items-center gap-1" title={d.viewDnsMessage}>
                                            <XCircle size={11} className="text-red-400"/> ViewDNS: 0 IP
                                          </span>
                                          <a 
                                            href={`https://viewdns.info/iphistory/?domain=${d.url}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[9px] font-bold text-slate-400 hover:text-purple-300 underline flex items-center" 
                                            title="Mở trực tiếp trang ViewDNS.info trên trình duyệt"
                                          >
                                            ViewDNS ↗
                                          </a>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={(e) => checkSingleViewDnsHistory(d.id, e)}
                                          className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-800 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-700 hover:border-purple-700 flex items-center gap-1 transition-all"
                                          title="Bấm để tự động kiểm tra lịch sử IP trên ViewDNS.info"
                                        >
                                          <Server size={11}/> Check ViewDNS
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[10px] font-black uppercase tracking-wider">
                                        <span className="flex flex-col"><span className="text-slate-600">DR</span><b className="text-orange-400 text-xs">{d.dr}</b></span>
                                        <span className="flex flex-col"><span className="text-slate-600">TF</span><b className="text-purple-400 text-xs">{d.tf}</b></span>
                                        <span className="flex flex-col"><span className="text-slate-600">RD</span><b className="text-blue-400 text-xs">{d.rd}</b></span>
                                        <span className="flex flex-col"><span className="text-slate-600">Traffic</span><b className="text-emerald-400 text-xs">{d.traffic.toLocaleString()}</b></span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    {(() => {
                                      const seoDiff = calculateSEODifficulty(d);
                                      return (
                                        <div className="space-y-1.5 min-w-[140px] max-w-[170px]">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${seoDiff.badgeBg} ${seoDiff.badgeText} ${seoDiff.badgeBorder}`}>
                                              {seoDiff.level}
                                            </span>
                                            <b className={`font-mono text-xs font-black ${seoDiff.color}`}>
                                              {seoDiff.score}/100
                                            </b>
                                          </div>
                                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                            <div 
                                              className={`h-full transition-all rounded-full ${
                                                seoDiff.score <= 25 ? 'bg-emerald-400' :
                                                seoDiff.score <= 45 ? 'bg-teal-400' :
                                                seoDiff.score <= 65 ? 'bg-amber-400' :
                                                seoDiff.score <= 80 ? 'bg-orange-500' : 'bg-rose-500'
                                              }`} 
                                              style={{ width: `${seoDiff.score}%` }}
                                            />
                                          </div>
                                          <div className="text-[9px] text-slate-400 flex items-center justify-between">
                                            <span>Mật độ từ khóa:</span>
                                            <b className="text-slate-200 font-mono">{seoDiff.keywordDensity}%</b>
                                          </div>
                                          {seoDiff.reasons.length > 0 && (
                                            <div className="text-[8px] text-slate-400 italic truncate" title={seoDiff.reasons.join(' • ')}>
                                              💡 {seoDiff.reasons[0]}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border w-fit ${d.marketplace === 'SAV' ? 'bg-orange-950/30 text-orange-400 border-orange-900/50' : 'bg-red-950/30 text-red-400 border-red-900/50'}`}>
                                            {d.marketplace}
                                        </span>
                                        <span className={`text-[11px] font-bold uppercase tracking-tight flex items-center gap-1 ${d.isAuction ? 'text-yellow-500' : 'text-slate-400'}`}>
                                            {d.isAuction ? <><Gavel size={12}/> Đấu giá ({d.bidCount || 0})</> : <><Globe size={12}/> Mua trực tiếp</>}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-6"><div className="font-mono font-black text-emerald-400 text-2xl">${d.price}</div></td>
                                <td className="p-6 text-[10px] text-slate-400 font-mono space-y-1.5">
                                    <div className="font-sans font-black text-blue-300 text-[11px] flex items-center gap-1.5">
                                      <History size={13} className="text-blue-400 flex-shrink-0"/>
                                      <span>Saved <b className="text-white">{d.archiveSnapshots}</b> times</span>
                                    </div>
                                    <div className="text-[10px] text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 flex justify-between items-center">
                                      <span>Lịch sử:</span>
                                      <b className="text-emerald-400 font-mono">{d.archiveFirstSeen} — 2026</b>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 pt-0.5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-1 border ${
                                          d.waybackScore >= 80 
                                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' 
                                            : d.waybackScore >= 60 
                                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/80' 
                                            : 'bg-red-950/60 text-red-400 border-red-800/80'
                                        }`}>
                                            Score: {d.waybackScore}/100
                                        </span>
                                        <a href={`https://web.archive.org/web/*/${d.url}`} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5">
                                          Xem Wayback ↗
                                        </a>
                                    </div>
                                    {d.waybackSpamFlags && d.waybackSpamFlags.length > 0 && (
                                      <div className="text-[8px] text-amber-400/90 font-sans italic truncate max-w-[150px]" title={d.waybackSpamFlags.join(', ')}>
                                        ⚠️ {d.waybackSpamFlags.join(', ')}
                                      </div>
                                    )}
                                </td>
                                <td className="p-6 text-[10px]">
                                    <div className="space-y-1.5 max-w-[210px]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Điểm Tiềm Năng:</span>
                                            <b className={`font-mono text-xs font-black ${
                                                (d.growthPotentialScore || 0) >= 70 ? 'text-emerald-400' :
                                                (d.growthPotentialScore || 0) >= 50 ? 'text-amber-400' : 'text-slate-400'
                                            }`}>
                                                {d.growthPotentialScore}/100
                                            </b>
                                        </div>
                                        
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                            <div 
                                              className={`h-full transition-all rounded-full ${
                                                (d.growthPotentialScore || 0) >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                                (d.growthPotentialScore || 0) >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-slate-600'
                                              }`} 
                                              style={{ width: `${Math.min(100, Math.max(5, d.growthPotentialScore || 0))}%` }}
                                            />
                                        </div>

                                        {d.growthPotentialReasons && d.growthPotentialReasons.length > 0 && (
                                            <div className="flex flex-col gap-1 pt-0.5">
                                                {d.growthPotentialReasons.map((reason, idx) => (
                                                    <span key={idx} className="text-[9px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                                                        <TrendingUp size={10} className="text-amber-400 flex-shrink-0"/>
                                                        <span className="truncate">{reason}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sparkline mini chart for 6-month forecasted traffic */}
                                        <TrafficForecastSparkline domain={d} />
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="grid grid-cols-2 gap-2 max-w-[340px] mx-auto">
                                        <a href={`https://lookup.icann.org/en/lookup?name=${d.url}`} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-cyan-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 border border-slate-700 transition-all" title="Kiểm tra trực tiếp thông tin WHOIS chính thức của ICANN"><Globe size={12}/> ICANN WHOIS</a>
                                        <a href={`https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${d.url}`} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-emerald-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all" title="Kiểm tra tình trạng tự do mua trên GoDaddy"><ShoppingCart size={12}/> GODADDY CHECK</a>
                                        <a href={`https://web.archive.org/web/*/${d.url}`} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-blue-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-blue-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><History size={12}/> WAYBACK</a>
                                        <a href={`https://viewdns.info/iphistory/?domain=${d.url}`} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-purple-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-purple-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all" title="Lịch sử đổi IP hosting/DNS trên ViewDNS"><Server size={12}/> VIEWDNS IP</a>
                                        <a href={`https://transparencyreport.google.com/safe-browsing/search?url=${d.url}`} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-emerald-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><ShieldCheck size={12}/> GOOGLE SAFE</a>
                                        <a href={`https://www.virustotal.com/gui/domain/${d.url}`} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-indigo-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><Bug size={12}/> VIRUSTOTAL</a>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <a href={d.marketplace === 'SAV' ? `https://marketing.sav.com/domains?search=${d.url}` : `https://www.namecheap.com/domains/registration/results/?domain=${d.url}`} target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-2xl text-xs font-black inline-flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-105 active:scale-95">
                                            {d.isAuction ? <Gavel size={14}/> : <ShoppingCart size={14}/>} ĐẾN SÀN
                                        </a>
                                        <button 
                                          onClick={(e) => deleteSingleDomain(d.id, e)}
                                          className="p-3 rounded-2xl bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/60 hover:border-red-500 transition-all hover:scale-105 active:scale-95"
                                          title="Xóa tên miền này khỏi danh sách"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {displayedDomains.length === 0 && (
                  <div className="p-32 text-center bg-slate-950/30">
                    <Database size={64} className="mx-auto text-slate-800 mb-6"/>
                    <p className="text-xl font-bold text-slate-600 uppercase tracking-widest">
                      {filterMode === 'high_potential' 
                        ? "Không có domain đạt chuẩn High Potential" 
                        : filterMode === 'available_only'
                        ? "Chưa có domain nào được xác nhận đã hết hạn (NXDOMAIN)"
                        : filterMode === 'has_viewdns_history'
                        ? "Chưa có domain nào được xác nhận có lịch sử IP trên ViewDNS.info"
                        : filterMode === 'duplicate_only'
                        ? "Danh sách hoàn toàn sạch, không có tên miền bị trùng lặp"
                        : "Không có dữ liệu sạch"}
                    </p>
                    <p className="text-slate-700 mt-2 font-medium italic">
                      {filterMode === 'available_only' 
                        ? "Hãy nhấn nút 'Check Live Hết Hạn' để kiểm tra danh sách domain hiện tại."
                        : filterMode === 'has_viewdns_history'
                        ? "Hãy nhấn nút 'Check Lịch Sử ViewDNS' để tự động kiểm tra lịch sử."
                        : filterMode === 'duplicate_only'
                        ? "Tất cả các tên miền hiện tại trong bảng kết quả đều là bản ghi duy nhất."
                        : filterMode === 'high_potential'
                        ? "Thử chuyển về tab Tất cả để kiểm tra danh sách domain."
                        : "Vui lòng điều chỉnh lại bộ lọc chỉ số hoặc quét thêm dữ liệu mới."}
                    </p>
                  </div>
                )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (!authChecked) return null;
  if (!currentUser) return <AuthForm onLogin={u => setCurrentUser(u)}/>;
  if (currentUser.role === 'admin' && showAdminDashboard) return <AdminDashboard onLogout={() => { logout(); setCurrentUser(null); setShowAdminDashboard(false); }} onGoToTool={() => setShowAdminDashboard(false)} />;

  if (currentUser.role !== 'admin' && currentUser.subscriptionStatus !== 'active') {
    return (
      <SubscriptionPlan 
        user={currentUser} 
        onUpdate={() => setCurrentUser(getCurrentUser())} 
        onLogout={() => { logout(); setCurrentUser(null); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-600/30">
      <header className="h-24 bg-slate-900/95 backdrop-blur-2xl border-b border-slate-800 flex items-center justify-between px-12 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-6 cursor-pointer group" onClick={resetTool}>
          <div className="bg-gradient-to-br from-orange-400 via-red-500 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-[0_0_20px_rgba(239,68,68,0.3)] group-hover:rotate-6 transition-all border border-white/10 overflow-hidden relative">
             <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors"></div>
             <span className="relative z-10">P</span>
          </div>
          <div className="flex flex-col">
             <span className="text-2xl font-black text-white tracking-tighter leading-none">PBN <span className="text-blue-500">HUNTER</span></span>
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Power of Phoenix</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-bold shadow-inner" title="Nhấn Ctrl + Enter từ bất kỳ đâu để quét nhanh">
                <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse"/>
                <span>Quét nhanh:</span>
                <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Ctrl</kbd> + <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Enter</kbd>
            </div>
            <div className="flex gap-4">
                <a href="https://t.me/hima_dev" target="_blank" className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-5 py-2.5 rounded-xl text-xs font-black border border-blue-500/30 flex items-center gap-2 transition-all hover:scale-105">
                    <Send size={14}/> Telegram @hima_dev
                </a>
                <button onClick={() => setShowSyncModal(true)} className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-5 py-2.5 rounded-xl text-xs font-black border border-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105">
                    <Smartphone size={14}/> Đồng bộ thiết bị
                </button>
                <button onClick={() => setShowBugReport(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-black border border-slate-700 flex items-center gap-2 transition-all hover:scale-105">
                    <Bug size={14}/> Báo cáo lỗi
                </button>
            </div>
            {currentUser.role === 'admin' && (
                <button onClick={() => setShowAdminDashboard(true)} className="bg-red-600 text-white p-2.5 rounded-xl shadow-lg shadow-red-900/20 hover:bg-red-500 transition-all hover:scale-110 border border-red-500/50"><Shield size={20}/></button>
            )}
            <button onClick={() => { logout(); setCurrentUser(null); }} className="bg-slate-800 p-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all hover:scale-110"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1920px] mx-auto">
              <StepIndicator currentStep={currentStep}/>
              <div className="pb-20">{renderStepContent()}</div>
          </div>
      </main>

      {/* MODAL ĐỒNG BỘ THIẾT BỊ */}
      {showSyncModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-white flex items-center gap-2"><Smartphone className="text-emerald-500"/> Đồng bộ thiết bị mới</h3>
                      <button onClick={() => setShowSyncModal(false)} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"><X/></button>
                  </div>
                  <div className="space-y-6">
                      <p className="text-sm text-slate-400 font-medium">Sao chép mã dưới đây và dán vào phần <b>"Sync"</b> ở màn hình đăng nhập trên thiết bị mới của bạn để chuyển phiên làm việc ngay lập tức.</p>
                      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl relative group">
                          <textarea readOnly className="w-full h-32 bg-transparent text-[10px] text-emerald-500 font-mono outline-none resize-none custom-scrollbar pr-10" value={btoa(JSON.stringify(currentUser))}></textarea>
                          <button onClick={copySyncCode} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700"><Copy size={16}/></button>
                      </div>
                      <button onClick={() => setShowSyncModal(false)} className="w-full bg-slate-800 text-white p-4 rounded-2xl font-black transition-all hover:bg-slate-700 active:scale-95 uppercase tracking-widest text-xs">Đóng lại</button>
                  </div>
              </div>
          </div>
      )}

      {showBugReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Bug className="text-red-500"/> Báo cáo lỗi cho Admin</h3>
                    <button onClick={() => setShowBugReport(false)} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"><X/></button>
                </div>
                <form onSubmit={handleBugSubmit} className="space-y-6">
                    <p className="text-sm text-slate-400">Gặp sự cố gì hãy mô tả ở đây bạn nhé. Admin sẽ kiểm tra và phản hồi qua Telegram hoặc Mail.</p>
                    <textarea required value={bugContent} onChange={e => setBugContent(e.target.value)} className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-medium text-sm custom-scrollbar" placeholder="Nhập chi tiết lỗi..."></textarea>
                    <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-900/30 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95"><Send size={18}/> GỬI BÁO CÁO NGAY</button>
                </form>
            </div>
        </div>
      )}

      {showBulkTldModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Layers className="text-blue-500"/> Thêm TLD Hàng Loạt (Bulk Add TLDs)
              </h3>
              <button onClick={() => setShowBulkTldModal(false)} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                <X/>
              </button>
            </div>
            <form onSubmit={handleBulkTldAdd} className="space-y-6">
              <p className="text-sm text-slate-400 font-medium">
                Dán danh sách đuôi tên miền (TLD) phân cách bằng <b>dấu phẩy (,), khoảng trắng, hoặc xuống dòng</b>:
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <textarea 
                  required 
                  value={bulkTldInput} 
                  onChange={e => setBulkTldInput(e.target.value)} 
                  className="w-full h-40 bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none custom-scrollbar" 
                  placeholder=".com, .net, .org, .info, .io, .vn, .jp, .app, .xyz"
                ></textarea>
              </div>
              <div className="flex gap-2 text-xs text-slate-500">
                <span>Ví dụ:</span>
                <code className="text-blue-400 font-mono">.com, .net, .org, io, vn, app</code>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowBulkTldModal(false)} 
                  className="flex-1 bg-slate-800 text-slate-300 p-4 rounded-2xl font-black hover:bg-slate-700 transition-all uppercase tracking-wider text-xs"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-900/30 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wider text-xs"
                >
                  <Plus size={18}/> THÊM VÀO DANH SÁCH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {copyToast && (
        <div className="fixed bottom-10 right-10 z-[70] bg-emerald-600 text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-950 flex items-center gap-3 animate-in slide-in-from-bottom-5 border border-emerald-400">
          <CheckCircle2 size={22} className="text-white flex-shrink-0"/>
          <span className="text-sm font-bold">{copyToast}</span>
        </div>
      )}
      
      <footer className="bg-slate-900 border-t border-slate-800 p-6 px-12 flex justify-between items-center text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">
          <div>© 2025 PBN Hunter Pro | Contact Telegram: <a href="https://t.me/hima_dev" target="_blank" className="text-blue-500 hover:underline">@hima_dev</a></div>
          <div className="flex gap-10">
              <span className="flex items-center gap-2"><Activity size={12} className="text-emerald-500"/> Hybrid Core Active</span>
              <span className="flex items-center gap-2"><TrendingUp size={12} className="text-blue-500"/> Scan Speed: High Performance</span>
          </div>
      </footer>
    </div>
  );
}
