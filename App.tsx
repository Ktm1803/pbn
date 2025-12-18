
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { FilterControl } from './components/FilterControl';
import { Step, DomainEntity, DomainStatus, FilterConfig, User, PLANS } from './types';
import { analyzeDomainBatch, generateMockDomains } from './services/geminiService';
import { getCurrentUser, logout } from './services/authService';
import { AuthForm, SubscriptionPlan, AdminDashboard, SyncModal } from './components/AuthComponents';
import { Play, Settings, CheckCircle2, AlertTriangle, Download, RefreshCw, Search, Bot, Globe, ShieldCheck, Filter, PlusCircle, DollarSign, History, ExternalLink, ShoppingCart, CheckSquare, Square, X, XCircle, LogOut, Smartphone, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Realistic Registration Fees (approx Namecheap/Godaddy pricing)
// Updated with requested extensions and common PBN TLDs
const REG_FEES: Record<string, number> = {
  // Original / Common
  '.com': 10.28,
  '.net': 11.98,
  '.org': 9.68,
  '.info': 3.98,
  '.biz': 4.98,
  '.co': 23.98,
  '.io': 39.98,
  
  // Requested Extensions
  '.co.net': 15.00,
  '.uk.net': 12.99,
  '.us.net': 12.99,
  '.co.org': 15.00,
  '.uk.org': 9.50,
  '.jp.net': 14.50,
  '.jp.co': 40.00, // Keeping as requested
  
  // Valid equivalents / Common ccTLDs
  '.co.jp': 40.00,
  '.co.uk': 9.48,
  '.org.uk': 9.48,
  '.eu': 6.99,
  '.de': 5.99,
  '.ca': 11.99,
  '.in': 5.99,
  '.me': 18.99,

  // Budget / New gTLDs
  '.xyz': 0.99,
  '.site': 1.99,
  '.online': 1.99,
  '.tech': 4.99,
  '.store': 2.99,
};

const SUPPORTED_TLDS = Object.keys(REG_FEES).filter(tld => !tld.endsWith('.vn')); // Explicitly exclude .vn just in case

// Dictionary for realistic domain generation
const REALISTIC_SUFFIXES = [
  'news', 'blog', 'daily', 'today', 'world', 'guide', 'tips', 'hub', 
  'central', 'pro', 'expert', 'reviews', 'market', 'trends', 'report',
  'insider', 'base', 'zone', 'place', 'spot', 'link', 'connect'
];

const REALISTIC_PREFIXES = [
  'the', 'my', 'get', 'top', 'best', 'pro', 'all', 'we', 'i', 'your'
];

// Mock Data Generators
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getMockStatus = (): 'Clean' | 'Spam' | 'Mixed' => {
  const r = Math.random();
  if (r > 0.7) return 'Spam';
  if (r > 0.5) return 'Mixed';
  return 'Clean';
};

const COMMON_TLDS = ['.com', '.net', '.org', '.info', '.co', '.io'];
const SPECIAL_TLDS = ['.co.net', '.uk.net', '.us.net', '.co.org', '.uk.org', '.jp.net', '.jp.co'];

export default function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // --- APP STATE ---
  const [currentStep, setCurrentStep] = useState<Step>(Step.Crawl);
  const [domains, setDomains] = useState<DomainEntity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Configuration State
  const [seedKeyword, setSeedKeyword] = useState("crypto");
  const [scanLimit, setScanLimit] = useState(100000); 
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    minDR: 10,
    minUR: 10,
    minRD: 5,
    minTF: 5,
    minCF: 5,
    maxPrice: 35, 
    excludeAdult: true,
    excludeGambling: true,
    allowedTLDs: [], // Empty means all
  });
  const [customTldInput, setCustomTldInput] = useState("");

  const [aiReport, setAiReport] = useState<string>("");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Check login on mount
  useEffect(() => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setAuthChecked(true);
      // If user is admin, default to dashboard view
      if (user?.role === 'admin') {
          setShowAdminDashboard(true);
      }
  }, []);

  // Derived state for clean domains
  const cleanDomains = domains.filter(d => d.status === DomainStatus.Clean);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Reset selection when entering Output step or resetting
  useEffect(() => {
      if (currentStep !== Step.Output) {
          setSelectedIds(new Set());
      }
  }, [currentStep]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => {
        const newLogs = [...prev, `[${time}] ${msg}`];
        return newLogs.slice(-50); 
    });
  };

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cleanDomains.length && cleanDomains.length > 0) {
        setSelectedIds(new Set());
    } else {
        // Select all clean domains
        setSelectedIds(new Set(cleanDomains.map(d => d.id)));
    }
  };

  const ignoreDomain = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent row click selection
    setDomains(prev => prev.map(d => 
        d.id === id ? { ...d, status: DomainStatus.Ignored } : d
    ));
    // Remove from selection if present
    if (selectedIds.has(id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
    }
    addLog("Đã bỏ qua domain.");
  };

  const handleTldToggle = (tld: string) => {
    setFilterConfig(prev => {
        const current = prev.allowedTLDs;
        if (current.includes(tld)) {
            return { ...prev, allowedTLDs: current.filter(t => t !== tld) };
        } else {
            return { ...prev, allowedTLDs: [...current, tld] };
        }
    });
  };

  const handleAddCustomTld = () => {
      if (!customTldInput.trim()) return;
      let tld = customTldInput.trim().toLowerCase();
      if (!tld.startsWith('.')) tld = '.' + tld;
      
      if (!filterConfig.allowedTLDs.includes(tld)) {
          setFilterConfig(prev => ({
              ...prev,
              allowedTLDs: [...prev.allowedTLDs, tld]
          }));
      }
      setCustomTldInput("");
  };

  // ---------------- AUTH HANDLERS ----------------
  const handleAuthUpdate = () => {
      setCurrentUser(getCurrentUser());
  };

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      if (user.role === 'admin') {
          setShowAdminDashboard(true);
      }
  };

  const handleLogout = () => {
      logout();
      setCurrentUser(null);
      setShowAdminDashboard(false);
  };

  // ---------------- STEP 1: CRAWL SIMULATION ----------------
  const startCrawl = async (append: boolean = false) => {
    setIsProcessing(true);
    
    if (!append) {
        setDomains([]);
        setLogs([]);
        addLog(`Bắt đầu crawl mới với từ khóa: ${seedKeyword}`);
    } else {
        addLog(`Tiếp tục crawl thêm domain với từ khóa: ${seedKeyword}`);
    }
    
    addLog(`Mục tiêu quét: ${scanLimit.toLocaleString()} domains.`);
    addLog("Đang kết nối API Archive.org để xác thực lịch sử và kiểm tra khả dụng...");

    // Get some realistic names from Gemini
    const realisticNames = await generateMockDomains(seedKeyword);
    
    let countInThisBatch = 0; 
    const batchSize = scanLimit > 100000 ? 5000 : 500; 

    const interval = setInterval(() => {
      const newBatch: DomainEntity[] = [];
      let attempts = 0;
      
      // Increased max attempts to find valid domains since filtering is strict
      while (newBatch.length < batchSize && attempts < batchSize * 10) {
        attempts++;
        if (countInThisBatch >= scanLimit) break;

        // --- NAME GENERATION STRATEGY: Realistic Combinations ---
        let nameRoot = seedKeyword.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Use Gemini suggestion occasionally
        if (Math.random() > 0.7 && realisticNames.length > 0) {
            nameRoot = realisticNames[Math.floor(Math.random() * realisticNames.length)].split('.')[0];
        }

        let domainName = nameRoot;
        const variation = Math.random();

        // Generate names that look like real websites (higher chance of archive history)
        if (variation > 0.7) {
            // Suffix: cryptonews, cryptoblog
            const suffix = REALISTIC_SUFFIXES[Math.floor(Math.random() * REALISTIC_SUFFIXES.length)];
            domainName = `${nameRoot}${suffix}`;
        } else if (variation > 0.4) {
            // Prefix: thecrypto, getcrypto
            const prefix = REALISTIC_PREFIXES[Math.floor(Math.random() * REALISTIC_PREFIXES.length)];
            domainName = `${prefix}${nameRoot}`;
        } else if (variation > 0.2) {
             // Hyphenated real words: crypto-guide
             const suffix = REALISTIC_SUFFIXES[Math.floor(Math.random() * REALISTIC_SUFFIXES.length)];
             domainName = `${nameRoot}-${suffix}`;
        }
        
        // --- RULE: Exclude long numbers (>= 4 digits) ---
        if (/\d{4,}/.test(domainName)) {
            continue; 
        }

        const randomTLD = SUPPORTED_TLDS[Math.floor(Math.random() * SUPPORTED_TLDS.length)];
        
        // --- RULE: Exclude .vn (just in case) ---
        if (randomTLD.endsWith('.vn')) {
            continue;
        }

        const fullUrl = `${domainName}${randomTLD}`;

        // --- VALIDATION 1: Check Archive.org History ---
        // Simulation: Only ~40% of generated names have valid archive history
        const hasWaybackHistory = Math.random() > 0.6; 
        
        if (!hasWaybackHistory) {
             continue; // Skip if no archive history
        }

        // --- VALIDATION 2: Check Availability (Is it buyable?) ---
        // Simulation: Only ~20% of domains with history are currently dropped/expired/available
        // If simulated result says "Already Registered", we skip it.
        const isAvailable = Math.random() > 0.8;

        if (!isAvailable) {
            continue; // Skip if bought or unavailable
        }

        countInThisBatch++;

        // Mock Metrics
        const dr = getRandomInt(0, 60);
        const tf = getRandomInt(0, 40);
        
        // --- PRICE LOGIC: Strict Reg Fee ---
        // Expired domains (dropped) are sold at standard registration fee.
        const regFee = REG_FEES[randomTLD] || 15.00;
        
        // 90% of the time, it's just the reg fee (maybe + ICANN fee simulation)
        // 10% chance it's a "Closeout" or "Auction" price
        let finalPrice = regFee;
        if (Math.random() > 0.90) {
            finalPrice += getRandomInt(5, 20); // Auction premium
        }

        const newDomain: DomainEntity = {
            id: Math.random().toString(36).substr(2, 9) + countInThisBatch + Date.now(),
            url: fullUrl,
            dr: dr,
            ur: getRandomInt(0, 55),
            rd: getRandomInt(0, 200),
            tf: tf,
            cf: getRandomInt(0, 45),
            anchorStatus: getMockStatus(),
            indexed: Math.random() > 0.3,
            waybackClean: Math.random() > 0.2,
            status: DomainStatus.Pending,
            checkProgress: 0,
            age: getRandomInt(1, 22), 
            isExpired: true, // Always true because we filtered out unavailable ones
            price: parseFloat(finalPrice.toFixed(2)) // Format to 2 decimal places
        };
        newBatch.push(newDomain);
      }

      setDomains(prev => {
          if (prev.length > 500000) {
              return [...prev.slice(batchSize), ...newBatch];
          }
          return [...prev, ...newBatch];
      });
      
      if (countInThisBatch % (batchSize * 2) === 0) {
          addLog(`Đang lọc Archive & Khả dụng... Đã tìm thấy ${countInThisBatch.toLocaleString()} domain.`);
      }

      if (countInThisBatch >= scanLimit) {
        clearInterval(interval);
        setIsProcessing(false);
        addLog(`HOÀN THÀNH: Đã thu thập ${countInThisBatch.toLocaleString()} domain hợp lệ (Có Archive & Mua được).`);
        addLog(`Tự động chuyển sang bước Lọc Chỉ Số...`);
        setTimeout(() => setCurrentStep(Step.Filter), 1500);
      }
    }, 100); 
  };

  // ---------------- STEP 2: FILTER LOGIC ----------------
  const applyFilters = () => {
    addLog(`Đang áp dụng bộ lọc cho ${domains.length.toLocaleString()} domains...`);
    setIsProcessing(true);

    setTimeout(() => {
      setDomains(prev => prev.map(d => {
        const passedMetrics = 
            d.dr >= filterConfig.minDR &&
            d.ur >= filterConfig.minUR &&
            d.rd >= filterConfig.minRD &&
            d.tf >= filterConfig.minTF &&
            d.cf >= filterConfig.minCF;
        
        const passedPrice = d.price <= filterConfig.maxPrice;
        
        // TLD Filter Logic
        const passedTLD = filterConfig.allowedTLDs.length === 0 || filterConfig.allowedTLDs.some(tld => d.url.endsWith(tld));

        const cleanContent = 
            (filterConfig.excludeGambling ? d.anchorStatus !== 'Spam' : true);

        if (passedMetrics && passedPrice && passedTLD && cleanContent) {
             return { ...d, status: DomainStatus.Analyzing };
        } else {
             return { ...d, status: DomainStatus.Spam }; 
        }
      }));
      
      setIsProcessing(false);
      addLog("Lọc hoàn tất. Chuyển sang kiểm tra Penalty.");
      setCurrentStep(Step.PenaltyCheck);
    }, 1000);
  };

  // ---------------- STEP 3: PENALTY CHECK SIMULATION ----------------
  const runPenaltyCheck = useCallback(() => {
    setIsProcessing(true);
    addLog("Kiểm tra Google Index & Wayback History...");
    
    const candidateDomains = domains.filter(d => d.status === DomainStatus.Analyzing);
    
    if (candidateDomains.length === 0) {
        addLog("Không có domain mới nào cần kiểm tra.");
        setIsProcessing(false);
        setCurrentStep(Step.Output);
        return;
    }

    addLog(`Cần kiểm tra: ${candidateDomains.length} domains.`);

    let checkedCount = 0;
    const checkBatchSize = Math.max(50, Math.floor(candidateDomains.length / 20)); 

    const checkInterval = setInterval(() => {
      setDomains(prev => {
        const next = [...prev];
        let processedInBatch = 0;

        for (let i = 0; i < next.length; i++) {
            if (processedInBatch >= checkBatchSize) break;
            
            if (next[i].status === DomainStatus.Analyzing) {
                const isSafe = next[i].indexed && next[i].waybackClean;
                next[i] = {
                    ...next[i],
                    status: isSafe ? DomainStatus.Clean : DomainStatus.Penalized,
                    checkProgress: 100
                };
                processedInBatch++;
                checkedCount++;
            }
        }
        return next;
      });

      if (checkedCount % (checkBatchSize * 5) === 0) {
          addLog(`Đang kiểm tra Penalty: ${checkedCount} / ${candidateDomains.length}...`);
      }

      if (checkedCount >= candidateDomains.length) {
        clearInterval(checkInterval);
        setIsProcessing(false);
        addLog("Hoàn tất kiểm tra Penalty.");
        setTimeout(() => setCurrentStep(Step.Output), 1000);
      }
    }, 100); 
  }, [domains]);

  useEffect(() => {
    if (currentStep === Step.PenaltyCheck && !isProcessing) {
        const timer = setTimeout(runPenaltyCheck, 500);
        return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);


  // ---------------- STEP 4: OUTPUT & AI ----------------
  const handleAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    addLog("Đang gửi dữ liệu tới Gemini AI...");
    // If selected, analyze selected, else analyze top 20 clean
    const domainsToAnalyze = selectedIds.size > 0 
        ? cleanDomains.filter(d => selectedIds.has(d.id)).slice(0, 20)
        : cleanDomains.slice(0, 20);
        
    const report = await analyzeDomainBatch(domainsToAnalyze, filterConfig);
    setAiReport(report);
    setIsAiAnalyzing(false);
    addLog("AI phân tích hoàn tất.");
  };

  const handleContinueCrawl = () => {
      setCurrentStep(Step.Crawl);
      addLog("Quay lại bước Thu Domain.");
  };

  const exportToCSV = () => {
      // Filter based on selection
      let domainsToExport = cleanDomains;
      if (selectedIds.size > 0) {
          domainsToExport = cleanDomains.filter(d => selectedIds.has(d.id));
      }

      if (domainsToExport.length === 0) {
          alert("Không có dữ liệu để xuất.");
          return;
      }

      addLog(`Đang tạo file CSV cho ${domainsToExport.length} domains...`);
      const headers = ["Domain", "Age", "Price", "DR", "TF", "RD", "CF", "UR", "Status", "Indexed", "Wayback Link"];
      const rows = domainsToExport.map(d => [
          d.url,
          d.age,
          d.price,
          d.dr,
          d.tf,
          d.rd,
          d.cf,
          d.ur,
          d.status,
          d.indexed ? "Yes" : "No",
          `https://web.archive.org/web/*/${d.url}`
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `pbn_hunter_export_${selectedIds.size > 0 ? 'selected' : 'all'}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog("Tải xuống hoàn tất.");
  };

  // Render Helpers
  const renderSidebar = () => (
    <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-80px)] md:h-auto overflow-y-auto p-4">
      <div className="mb-6">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">LOG HOẠT ĐỘNG</h3>
        <div className="bg-black/50 rounded-lg border border-slate-800 p-3 h-64 overflow-y-auto font-mono text-xs text-green-400 shadow-inner">
          {logs.length === 0 && <span className="text-slate-600 italic">Chờ lệnh...</span>}
          {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
          <div ref={logsEndRef} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">THỐNG KÊ NHANH</h3>
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 p-3 rounded border border-slate-700">
                <div className="text-xs text-slate-500">Total Found</div>
                <div className="text-xl font-bold text-white">{domains.length.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded border border-slate-700">
                <div className="text-xs text-slate-500">Clean</div>
                <div className="text-xl font-bold text-green-500">{cleanDomains.length.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded border border-slate-700">
                <div className="text-xs text-slate-500">Selected</div>
                <div className="text-xl font-bold text-blue-400">{selectedIds.size.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded border border-slate-700">
                <div className="text-xs text-slate-500">Ignored</div>
                <div className="text-xl font-bold text-slate-500">{domains.filter(d => d.status === DomainStatus.Ignored).length.toLocaleString()}</div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case Step.Crawl:
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-blue-600 p-3 rounded-full">
                        <Globe className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Thu thập Domain</h2>
                        <p className="text-slate-400">Nhập từ khóa để quét Archive.org và các nguồn expired.</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Seed Keyword</label>
                        <input 
                            type="text" 
                            value={seedKeyword}
                            onChange={(e) => setSeedKeyword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. health, crypto, marketing"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Giới hạn quét (Batch Size)</label>
                        <input 
                            type="number" 
                            value={scanLimit}
                            onChange={(e) => setScanLimit(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="100000000"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-800 rounded text-sm text-blue-300">
                        <History size={16} />
                        <span>Hệ thống tự động kiểm tra và chỉ lấy domain có lịch sử trên <b>web.archive.org</b> và trạng thái <b>Có thể mua</b>.</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 pt-4">
                        {domains.length > 0 ? (
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => startCrawl(false)}
                                    disabled={isProcessing}
                                    className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <RefreshCw size={20} />
                                    Quét Mới (Reset)
                                </button>
                                <button 
                                    onClick={() => startCrawl(true)}
                                    disabled={isProcessing}
                                    className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 text-white'}`}
                                >
                                    {isProcessing ? <RefreshCw className="animate-spin" /> : <PlusCircle fill="currentColor" className="text-blue-200" />}
                                    {isProcessing ? 'Đang Thu Thập...' : 'Quét Tiếp (Append)'}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => startCrawl(false)}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 text-white'}`}
                            >
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                                {isProcessing ? 'Đang Thu Thập...' : 'Bắt Đầu Quét'}
                            </button>
                        )}
                        {domains.length > 0 && (
                             <p className="text-center text-xs text-emerald-400 mt-2">
                                Hiện đang có {domains.length.toLocaleString()} domain trong bộ nhớ.
                             </p>
                        )}
                    </div>
                </div>
            </div>
          </div>
        );

      case Step.Filter:
        return (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Settings className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Cấu Hình Bộ Lọc Chỉ Số</h2>
                    </div>
                    <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-700">Ahrefs & Majestic API Enabled</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: Metrics */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 border-b border-slate-700 pb-2">Ahrefs Metrics</h3>
                        <FilterControl 
                            label="Min DR" min={0} max={80} 
                            value={filterConfig.minDR} 
                            onChange={(v) => setFilterConfig({...filterConfig, minDR: v})}
                            colorClass="text-orange-400"
                        />
                        <FilterControl 
                            label="Min UR" min={0} max={80} 
                            value={filterConfig.minUR} 
                            onChange={(v) => setFilterConfig({...filterConfig, minUR: v})}
                        />
                        <FilterControl 
                            label="Min RD" min={0} max={500} 
                            value={filterConfig.minRD} 
                            onChange={(v) => setFilterConfig({...filterConfig, minRD: v})}
                        />
                    </div>

                    {/* RIGHT COLUMN: Majestic & Other */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 border-b border-slate-700 pb-2">Majestic & Price</h3>
                        <FilterControl 
                            label="Min TF" min={0} max={80} 
                            value={filterConfig.minTF} 
                            onChange={(v) => setFilterConfig({...filterConfig, minTF: v})}
                            colorClass="text-purple-400"
                        />
                        <FilterControl 
                            label="Min CF" min={0} max={80} 
                            value={filterConfig.minCF} 
                            onChange={(v) => setFilterConfig({...filterConfig, minCF: v})}
                        />

                         <div className="my-4 pt-2 border-t border-slate-700/50">
                            <FilterControl 
                                label="Max Price ($)" 
                                min={5} max={100} 
                                value={filterConfig.maxPrice} 
                                onChange={(v) => setFilterConfig({...filterConfig, maxPrice: v})}
                                colorClass="text-emerald-400"
                                description="Giới hạn giá (Khuyên dùng: < $15 cho Reg Fee)"
                            />
                        </div>
                        
                        <div className="mt-6 p-4 bg-slate-900 rounded border border-slate-700">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={filterConfig.excludeGambling}
                                    onChange={(e) => setFilterConfig({...filterConfig, excludeGambling: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-600 text-blue-600 bg-slate-700" 
                                />
                                <span className="text-slate-300 text-sm">Loại bỏ Gambling / Betting</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* TLD Filter Section */}
                <div className="mt-8 border-t border-slate-700 pt-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
                        <span>Lọc theo đuôi tên miền (TLD)</span>
                        <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-1 rounded">
                            {filterConfig.allowedTLDs.length === 0 ? "Tất cả đuôi" : `${filterConfig.allowedTLDs.length} đuôi đã chọn`}
                        </span>
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Common TLDs */}
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Phổ biến</p>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_TLDS.map(tld => (
                                    <label key={tld} className={`cursor-pointer px-3 py-1.5 rounded text-sm font-medium border transition-all ${filterConfig.allowedTLDs.includes(tld) ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                                        <input type="checkbox" className="hidden" checked={filterConfig.allowedTLDs.includes(tld)} onChange={() => handleTldToggle(tld)} />
                                        {tld}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Special/Requested TLDs */}
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Mở rộng & Country Code</p>
                            <div className="flex flex-wrap gap-2">
                                {SPECIAL_TLDS.map(tld => (
                                    <label key={tld} className={`cursor-pointer px-3 py-1.5 rounded text-sm font-medium border transition-all ${filterConfig.allowedTLDs.includes(tld) ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                                        <input type="checkbox" className="hidden" checked={filterConfig.allowedTLDs.includes(tld)} onChange={() => handleTldToggle(tld)} />
                                        {tld}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Custom Input */}
                        <div>
                             <p className="text-xs text-slate-500 uppercase font-bold mb-2">Tùy chỉnh</p>
                             <div className="flex gap-2 max-w-sm">
                                <input 
                                    type="text" 
                                    value={customTldInput}
                                    onChange={(e) => setCustomTldInput(e.target.value)}
                                    placeholder="Nhập đuôi (VD: .xyz)"
                                    className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white flex-1 outline-none focus:border-blue-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTld()}
                                />
                                <button onClick={handleAddCustomTld} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm font-bold">Thêm</button>
                             </div>
                             {filterConfig.allowedTLDs.filter(t => !COMMON_TLDS.includes(t) && !SPECIAL_TLDS.includes(t)).length > 0 && (
                                 <div className="flex flex-wrap gap-2 mt-2">
                                     {filterConfig.allowedTLDs.filter(t => !COMMON_TLDS.includes(t) && !SPECIAL_TLDS.includes(t)).map(tld => (
                                        <div key={tld} className="flex items-center gap-1 bg-slate-700 text-white px-2 py-1 rounded text-xs">
                                            <span>{tld}</span>
                                            <button onClick={() => handleTldToggle(tld)} className="hover:text-red-400"><X size={12}/></button>
                                        </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
                    <button 
                        onClick={applyFilters}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                    >
                        <Filter size={20} />
                        Áp Dụng Bộ Lọc
                    </button>
                </div>
            </div>
          </div>
        );

      case Step.PenaltyCheck:
        return (
          <div className="max-w-3xl mx-auto mt-10 text-center">
             <div className="bg-slate-800 rounded-2xl p-10 border border-slate-700 shadow-2xl flex flex-col items-center">
                <div className="relative mb-6">
                     <div className="w-24 h-24 border-4 border-slate-700 rounded-full animate-pulse absolute top-0 left-0"></div>
                     <div className="w-24 h-24 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                     <ShieldCheck className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Đang Kiểm Tra Penalty</h2>
                <p className="text-slate-400 max-w-md">Kiểm tra Google Index, lịch sử Archive.org và SpamHaus.</p>
                
                <div className="mt-8 w-full max-w-md bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${(domains.filter(d => d.status === DomainStatus.Clean || d.status === DomainStatus.Penalized).length / (domains.filter(d => d.status !== DomainStatus.Spam).length || 1)) * 100}%` }}></div>
                </div>
                <p className="mt-2 text-sm text-slate-500 font-mono">Processing batch...</p>
             </div>
          </div>
        );

      case Step.Output:
        return (
          <div className="flex flex-col h-full">
             <div className="flex justify-between items-center mb-4 px-4">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" />
                    Kết Quả Phân Tích
                 </h2>
                 <div className="flex gap-3">
                     <button onClick={handleContinueCrawl} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center gap-2 text-sm font-bold border border-indigo-400"><PlusCircle size={16} /> Tìm thêm</button>
                     <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2 text-sm"><RefreshCw size={16} /> Reset</button>
                     <button 
                        onClick={exportToCSV} 
                        disabled={cleanDomains.length === 0} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-2 text-sm font-bold shadow-lg disabled:opacity-50 transition-all"
                     >
                         <Download size={16} /> 
                         {selectedIds.size > 0 ? `Xuất ${selectedIds.size} Đã Chọn` : 'Xuất Tất Cả CSV'}
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 mb-6">
                 {/* Data Table */}
                 <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-xl">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs text-slate-500 flex justify-between items-center">
                         <span>Hiển thị 100 kết quả tốt nhất.</span>
                         {selectedIds.size > 0 && <span className="text-blue-400 font-bold">Đã chọn: {selectedIds.size}</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 border-b border-slate-700 w-10">
                                        <div className="flex items-center justify-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={cleanDomains.length > 0 && selectedIds.size === cleanDomains.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4 border-b border-slate-700">Domain / Check</th>
                                    <th className="p-4 border-b border-slate-700 text-center">Tuổi (Năm)</th>
                                    <th className="p-4 border-b border-slate-700 text-center">Expired?</th>
                                    <th className="p-4 border-b border-slate-700">Giá Reg</th>
                                    <th className="p-4 border-b border-slate-700 font-bold text-orange-400">DR</th>
                                    <th className="p-4 border-b border-slate-700 font-bold text-purple-400">TF</th>
                                    <th className="p-4 border-b border-slate-700">RD</th>
                                    <th className="p-4 border-b border-slate-700">Status</th>
                                    <th className="p-4 border-b border-slate-700 text-center">Bỏ qua</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-300">
                                {cleanDomains.slice(0, 100).map((domain) => {
                                    const isSelected = selectedIds.has(domain.id);
                                    return (
                                        <tr 
                                            key={domain.id} 
                                            className={`border-b border-slate-700 transition-colors ${isSelected ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-slate-750'}`}
                                            onClick={(e) => {
                                                // Allow clicking anywhere in the row to toggle, except when clicking links
                                                if (!(e.target as HTMLElement).closest('a') && !(e.target as HTMLElement).closest('button')) {
                                                    toggleSelection(domain.id);
                                                }
                                            }}
                                        >
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(domain.id)}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`font-mono text-base font-bold ${isSelected ? 'text-blue-300' : 'text-white'}`}>{domain.url}</span>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <a 
                                                            href={`https://web.archive.org/web/*/${domain.url}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline z-10"
                                                        >
                                                            <History size={12} /> Archive
                                                        </a>
                                                        <span className="text-slate-600">|</span>
                                                        <a 
                                                            href={`https://transparencyreport.google.com/safe-browsing/search?url=${domain.url}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:underline z-10"
                                                            title="Check Google Penalty (Safe Browsing)"
                                                        >
                                                            <Shield size={12} /> Google Safe
                                                        </a>
                                                        <span className="text-slate-600">|</span>
                                                        <a 
                                                            href={`https://www.namecheap.com/domains/registration/results/?domain=${domain.url}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-orange-400 hover:text-orange-300 hover:underline z-10"
                                                        >
                                                            <ShoppingCart size={12} /> Buy
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-mono text-slate-400">
                                                {domain.age}
                                            </td>
                                            <td className="p-4 text-center">
                                                {domain.isExpired ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-900/40 text-red-400 border border-red-800">YES</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700">NO</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-emerald-400">
                                                ${domain.price}
                                            </td>
                                            <td className="p-4 font-bold text-orange-400">{domain.dr}</td>
                                            <td className="p-4 font-bold text-purple-400">{domain.tf}</td>
                                            <td className="p-4">{domain.rd}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-green-900/50 text-green-400 border border-green-700">CLEAN</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={(e) => ignoreDomain(e, domain.id)}
                                                    className="p-1.5 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Bỏ qua domain này"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {cleanDomains.length === 0 && (
                                    <tr><td colSpan={10} className="p-8 text-center text-slate-500">Không tìm thấy domain nào sạch.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>

                 {/* AI Analysis */}
                 <div className="flex flex-col gap-4">
                     <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl border border-indigo-700/50 p-5 shadow-xl">
                         <div className="flex items-center gap-2 mb-3">
                             <Bot className="text-pink-400" size={20} />
                             <h3 className="text-white font-bold">Gemini AI Audit</h3>
                         </div>
                         <div className="bg-black/30 rounded p-3 min-h-[150px] text-sm text-slate-300 leading-relaxed mb-3">
                            {isAiAnalyzing ? (
                                <div className="flex items-center justify-center h-full gap-2 text-slate-400"><RefreshCw className="animate-spin" size={16} /> AI đang đọc chỉ số...</div>
                            ) : aiReport ? (
                                <div className="markdown-body prose prose-invert prose-sm max-h-60 overflow-y-auto">
                                   {aiReport.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
                                </div>
                            ) : (
                                <p className="italic text-slate-500 text-center pt-10">Nhấn nút bên dưới để AI đánh giá lô domain này.</p>
                            )}
                         </div>
                         <button onClick={handleAiAnalysis} disabled={isAiAnalyzing || cleanDomains.length === 0} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-sm transition-colors disabled:opacity-50"><Bot className="inline mr-2" size={16}/> Phân Tích {selectedIds.size > 0 ? '(Đã chọn)' : 'Nâng Cao'}</button>
                     </div>

                     <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex-1 min-h-[200px]">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Phân bố Giá ($)</h4>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cleanDomains.slice(0, 500)}>
                                    <XAxis dataKey="url" hide />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}} itemStyle={{color: '#fff'}} cursor={{fill: 'transparent'}} formatter={(value) => `$${value}`} />
                                    <Bar dataKey="price" fill="#10b981" radius={[4, 4, 0, 0]}>
                                        {cleanDomains.slice(0, 500).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.price > 20 ? '#f59e0b' : '#10b981'} />))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     </div>
                 </div>
             </div>
          </div>
        );
    }
  };

  // --- RENDERING CONDITIONS ---
  
  if (!authChecked) {
      return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Đang tải...</div>;
  }

  // 1. Not Logged In -> Show Login
  if (!currentUser) {
      return <AuthForm onLogin={handleLoginSuccess} />;
  }

  // 2. Is Admin AND in Admin View -> Show Dashboard
  if (currentUser.role === 'admin' && showAdminDashboard) {
      return <AdminDashboard onLogout={handleLogout} onGoToTool={() => setShowAdminDashboard(false)} />;
  }

  // 3. Is User BUT Inactive/Pending -> Show Pricing
  if (currentUser.subscriptionStatus !== 'active' && currentUser.role !== 'admin') {
      return (
        <>
            <SubscriptionPlan user={currentUser} onUpdate={handleAuthUpdate} onLogout={handleLogout} />
        </>
      );
  }

  // 4. Active User (or Admin in Tool View) -> Show Main App
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* SYNC MODAL */}
      {showSyncModal && currentUser && (
          <SyncModal user={currentUser} onClose={() => setShowSyncModal(false)} />
      )}

      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center font-bold text-white">P</div>
          <span className="text-lg font-bold text-white tracking-tight">PBN <span className="text-blue-500">Hunter</span> Pro</span>
        </div>
        <div className="flex items-center gap-4">
            {currentUser.role === 'admin' && (
                 <button onClick={() => setShowAdminDashboard(true)} className="hidden md:flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-full border border-red-500 shadow-lg shadow-red-900/20 transition-all">
                    <ShieldCheck size={14} /> Admin Dashboard
                 </button>
            )}
            
            <button onClick={() => setShowSyncModal(true)} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition-colors" title="Đồng bộ thiết bị">
                <Smartphone size={14} /> <span className="hidden sm:inline">Sync</span>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>{currentUser.email}</span>
                <span className="text-slate-600">|</span>
                <span className="text-yellow-400 font-bold">{PLANS[currentUser.plan!]?.name || (currentUser.role === 'admin' ? 'Unlimited' : 'Pro')}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Đăng xuất">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <StepIndicator currentStep={currentStep} />
            <div className="flex-1 overflow-y-auto relative z-10">{renderStepContent()}</div>
        </main>
        {renderSidebar()}
      </div>
    </div>
  );
}
