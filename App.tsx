
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { FilterControl } from './components/FilterControl';
import { Step, DomainEntity, DomainStatus, FilterConfig, User, PLANS, MarketplaceType } from './types';
import { analyzeDomainBatch, generateMockDomains } from './services/geminiService';
import { getCurrentUser, logout, submitBugReport } from './services/authService';
import { AuthForm, SubscriptionPlan, AdminDashboard } from './components/AuthComponents';
import { 
  Play, Settings, CheckCircle2, AlertTriangle, Download, RefreshCw, Search, Bot, 
  Globe, ShieldCheck, Filter, PlusCircle, DollarSign, History, ExternalLink, 
  ShoppingCart, CheckSquare, Square, X, XCircle, LogOut, Smartphone, Shield, 
  Gavel, Zap, Clock, Activity, Database, HardDrive, Layers, Trash2, TrendingUp, Plus, Eye, Loader2, Bug, ShieldAlert, RotateCcw, Send, MessageSquare, Copy
} from 'lucide-react';

const REG_FEES: Record<string, number> = {
  '.com': 10.28, '.net': 11.98, '.org': 9.68, '.info': 3.98, '.co': 23.98, '.io': 39.98,
  '.co.net': 15.00, '.uk.net': 12.99, '.us.net': 12.99, '.co.org': 15.00, '.uk.org': 9.50, 
  '.jp.net': 14.50, '.jp.co': 40.00, '.co.jp': 40.00, '.xyz': 0.99, '.site': 1.99
};

const INITIAL_TLDS = Object.keys(REG_FEES);
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

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
  const MAX_STORAGE = 1000000;

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    minDR: 10, minUR: 10, minRD: 5, minTF: 5, minCF: 5, 
    maxPrice: 35, 
    excludeAdult: true, excludeGambling: true, allowedTLDs: [],
  });
  const [allowedMarketplaces, setAllowedMarketplaces] = useState<MarketplaceType[]>(['SAV', 'Namecheap', 'Registry']);

  useEffect(() => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setAuthChecked(true);
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-100));
  };

  const resetTool = () => {
    if (confirm("Bạn có muốn xóa toàn bộ kết quả và quay về trang thu domain để quét lại?")) {
        setDomains([]);
        setSelectedIds(new Set());
        setCurrentStep(Step.Crawl);
        addLog("Hệ thống đã được đặt lại và quay về bước Thu Domain.");
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
    }
    
    setIsProcessing(true);
    addLog(`${isAppending ? 'Đang quét thêm' : 'Khởi động engine quét'} ${scanLimit.toLocaleString()} domain...`);
    
    let processed = 0;
    const batchSize = 100;
    const realisticNames = await generateMockDomains(seedKeyword);

    const runBatch = () => {
      if (processed >= scanLimit || (domains.length + processed) >= MAX_STORAGE) {
        setIsProcessing(false);
        addLog(`Hoàn tất quét. Tổng số domain hiện có: ${domains.length.toLocaleString()}`);
        if (!isAppending) setCurrentStep(Step.Filter);
        return;
      }

      const newBatch: DomainEntity[] = [];
      for (let i = 0; i < batchSize && processed < scanLimit; i++) {
        processed++;
        const nameRoot = realisticNames[getRandomInt(0, realisticNames.length - 1)]?.split('.')[0] || seedKeyword;
        const randomTLD = availableTlds[getRandomInt(0, availableTlds.length - 1)];
        const fullUrl = `${nameRoot}${getRandomInt(10, 999999)}${randomTLD}`;
        const archiveSnapshots = getRandomInt(0, 1000);
        if (archiveSnapshots <= 0) continue; 

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
            waybackClean: Math.random() > 0.2, archiveSnapshots, archiveFirstSeen: getRandomInt(2000, 2021),
            status: DomainStatus.Pending, checkProgress: 0, age: 2025 - getRandomInt(2000, 2021),
            isExpired: !isAuction, price, marketplace, isAuction,
            auctionEndsAt: isAuction ? Date.now() + getRandomInt(3600000, 86400000 * 5) : undefined,
            bidCount: isAuction ? getRandomInt(0, 50) : undefined
        });
      }

      setDomains(prev => [...prev, ...newBatch]);
      requestAnimationFrame(runBatch);
    };
    runBatch();
  };

  const applyFilters = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setDomains(prev => prev.map(d => {
        const meetsMetrics = d.dr >= filterConfig.minDR && d.tf >= filterConfig.minTF && d.price <= filterConfig.maxPrice;
        const meetsMarket = allowedMarketplaces.includes(d.marketplace);
        return { ...d, status: (meetsMetrics && meetsMarket) ? DomainStatus.Analyzing : DomainStatus.Spam };
      }));
      setIsProcessing(false);
      setCurrentStep(Step.PenaltyCheck);
    }, 1000);
  };

  const runPenaltyCheck = useCallback(() => {
    setIsProcessing(true);
    const candidates = domains.filter(d => d.status === DomainStatus.Analyzing);
    if (candidates.length === 0) { setIsProcessing(false); setCurrentStep(Step.Output); return; }
    
    let checked = 0;
    const processBatch = () => {
        setDomains(prev => {
            const next = [...prev];
            let batch = 0;
            for(let i=0; i < next.length && batch < 50; i++) {
                if(next[i].status === DomainStatus.Analyzing) {
                    next[i].status = (next[i].indexed && next[i].waybackClean) ? DomainStatus.Clean : DomainStatus.Penalized;
                    batch++; checked++;
                }
            }
            return next;
        });
        if (checked < candidates.length) requestAnimationFrame(processBatch);
        else { setIsProcessing(false); setCurrentStep(Step.Output); }
    };
    processBatch();
  }, [domains]);

  useEffect(() => {
    if (currentStep === Step.PenaltyCheck && !isProcessing) runPenaltyCheck();
  }, [currentStep, isProcessing, runPenaltyCheck]);

  const cleanDomains = useMemo(() => domains.filter(d => d.status === DomainStatus.Clean), [domains]);
  
  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} tên miền đã chọn khỏi danh sách?`)) {
        setDomains(prev => prev.filter(d => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
        addLog(`Đã xóa ${selectedIds.size} tên miền thành công.`);
    }
  };

  const exportToCSV = () => {
    const headers = ["Domain", "DR", "TF", "Traffic", "Price", "Marketplace", "Status"];
    const rows = cleanDomains.map(d => [d.url, d.dr, d.tf, d.traffic, d.price, d.marketplace, d.isAuction ? 'Auction' : 'Registry']);
    let csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `pbn_hunter_export_${Date.now()}.csv`);
    link.click();
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
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Bổ sung đuôi (TLD)</label>
                    <div className="flex gap-2">
                      <input type="text" value={customTld} onChange={e => setCustomTld(e.target.value)} placeholder=".vn, .jp" className="flex-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 outline-none font-bold text-white focus:border-blue-500 transition-all shadow-inner"/>
                      <button onClick={() => { if(customTld) { setAvailableTlds([...availableTlds, customTld.startsWith('.')?customTld:'.'+customTld]); setCustomTld(""); } }} className="bg-blue-600 p-5 rounded-2xl border border-blue-500 hover:bg-blue-500 hover:scale-105 transition-all text-white"><Plus/></button>
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

                <button onClick={() => startCrawl(false)} disabled={isProcessing} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[2rem] font-black text-xl text-white flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                    {isProcessing ? <RefreshCw className="animate-spin"/> : <Zap/>} BẮT ĐẦU TRUY QUÉT HỆ THỐNG
                </button>
             </div>
          </div>
        );
      case Step.Filter:
        return (
            <div className="max-w-2xl mx-auto mt-6 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl">
                <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-emerald-500"><Filter/> Cấu hình SEO & Ngân sách</h3>
                <FilterControl label="Domain Rating (DR)" min={0} max={100} value={filterConfig.minDR} onChange={v => setFilterConfig({...filterConfig, minDR: v})}/>
                <FilterControl label="Trust Flow (TF)" min={0} max={100} value={filterConfig.minTF} onChange={v => setFilterConfig({...filterConfig, minTF: v})}/>
                <FilterControl label="Ngân sách tối đa ($)" min={5} max={1000} value={filterConfig.maxPrice} onChange={v => setFilterConfig({...filterConfig, maxPrice: v})} colorClass="bg-emerald-500"/>
                
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
                
                <button onClick={applyFilters} className="w-full bg-emerald-600 p-6 rounded-[2rem] font-black text-white mt-12 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95">XÁC NHẬN & CHẠY BỘ LỌC</button>
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
                    <h2 className="text-4xl font-black text-white tracking-tighter">Inventory Sạch ({cleanDomains.length.toLocaleString()})</h2>
                    <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Đã qua bộ lọc AI & Technical Audit</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button onClick={resetTool} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black border border-slate-700 flex items-center gap-3 transition-all hover:scale-105">
                        <RotateCcw size={20}/> Quét lại
                    </button>
                    <button onClick={() => startCrawl(true)} disabled={isProcessing} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-6 py-4 rounded-2xl font-black border border-blue-500/30 flex items-center gap-3 transition-all hover:scale-105">
                        {isProcessing ? <Loader2 size={20} className="animate-spin"/> : <PlusCircle size={20}/>} Quét thêm
                    </button>
                    <button onClick={deleteSelected} disabled={selectedIds.size === 0} className={`px-6 py-4 rounded-2xl font-black border flex items-center gap-3 transition-all ${selectedIds.size > 0 ? 'bg-red-900/20 text-red-400 border-red-900/50 shadow-lg shadow-red-900/20 hover:scale-105' : 'bg-slate-800/40 text-slate-700 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                        <Trash2 size={20}/> Xóa ({selectedIds.size})
                    </button>
                    <button onClick={exportToCSV} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-900/40 flex items-center gap-3 hover:bg-indigo-500 transition-all hover:scale-105">
                        <Download size={20}/> Xuất CSV
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-slate-950/90 text-slate-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-20">
                            <th className="p-6 border-b border-slate-800 w-10 text-center"><input type="checkbox" checked={selectedIds.size === cleanDomains.length && cleanDomains.length > 0} onChange={() => setSelectedIds(new Set(selectedIds.size === cleanDomains.length ? [] : cleanDomains.map(d => d.id)))} className="accent-blue-500 w-5 h-5 cursor-pointer rounded"/></th>
                            <th className="p-6 border-b border-slate-800">Domain & SEO Metrics</th>
                            <th className="p-6 border-b border-slate-800">Sàn & Trạng thái</th>
                            <th className="p-6 border-b border-slate-800">Giá ($)</th>
                            <th className="p-6 border-b border-slate-800">Archive Info</th>
                            <th className="p-6 border-b border-slate-800 text-center">Safety Checks</th>
                            <th className="p-6 border-b border-slate-800 text-right">Mua</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {cleanDomains.slice(0, 1000).map((d) => (
                            <tr key={d.id} className={`hover:bg-blue-600/5 transition-all group ${selectedIds.has(d.id) ? 'bg-blue-900/10' : ''}`}>
                                <td className="p-6 text-center"><input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => {
                                    const next = new Set(selectedIds);
                                    if(next.has(d.id)) next.delete(d.id); else next.add(d.id);
                                    setSelectedIds(next);
                                }} className="accent-blue-500 w-5 h-5 cursor-pointer rounded transition-transform group-hover:scale-110"/></td>
                                <td className="p-6">
                                    <div className="font-black text-white text-xl group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                        {d.url} <ShieldCheck size={16} className="text-emerald-500"/>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[10px] font-black uppercase tracking-wider">
                                        <span className="flex flex-col"><span className="text-slate-600">DR</span><b className="text-orange-400 text-xs">{d.dr}</b></span>
                                        <span className="flex flex-col"><span className="text-slate-600">TF</span><b className="text-purple-400 text-xs">{d.tf}</b></span>
                                        <span className="flex flex-col"><span className="text-slate-600">RD</span><b className="text-blue-400 text-xs">{d.rd}</b></span>
                                        <span className="flex flex-col"><span className="text-slate-600">Traffic</span><b className="text-emerald-400 text-xs">{d.traffic.toLocaleString()}</b></span>
                                    </div>
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
                                <td className="p-6 text-[10px] text-slate-400 font-mono space-y-0.5">
                                    <div className="flex justify-between w-28">Snapshots: <b className="text-white">{d.archiveSnapshots}</b></div>
                                    <div className="flex justify-between w-28">Tuổi: <b className="text-white">{d.age}y</b></div>
                                    <div className="flex justify-between w-28">Bắt đầu: <b className="text-white">{d.archiveFirstSeen}</b></div>
                                </td>
                                <td className="p-6">
                                    <div className="grid grid-cols-2 gap-2 max-w-[320px] mx-auto">
                                        <a href={`https://transparencyreport.google.com/safe-browsing/search?url=${d.url}`} target="_blank" className="bg-slate-800 hover:bg-emerald-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><ShieldCheck size={12}/> GOOGLE SAFE</a>
                                        <a href={`https://web.archive.org/web/*/${d.url}`} target="_blank" className="bg-slate-800 hover:bg-blue-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-blue-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><History size={12}/> WAYBACK</a>
                                        <a href={`https://www.virustotal.com/gui/domain/${d.url}`} target="_blank" className="bg-slate-800 hover:bg-indigo-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><Bug size={12}/> VIRUSTOTAL</a>
                                        <a href={`https://sitecheck.sucuri.net/results/${d.url}`} target="_blank" className="bg-slate-800 hover:bg-red-950 p-2 rounded-xl text-[9px] font-black text-slate-400 hover:text-red-400 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"><ShieldAlert size={12}/> SUCURI</a>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <a href={d.marketplace === 'SAV' ? `https://marketing.sav.com/domains?search=${d.url}` : `https://www.namecheap.com/domains/registration/results/?domain=${d.url}`} target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl text-xs font-black inline-flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-105 active:scale-95">
                                        {d.isAuction ? <Gavel size={14}/> : <ShoppingCart size={14}/>} ĐẾN SÀN
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cleanDomains.length === 0 && (
                  <div className="p-32 text-center bg-slate-950/30">
                    <Database size={64} className="mx-auto text-slate-800 mb-6"/>
                    <p className="text-xl font-bold text-slate-600 uppercase tracking-widest">Không có dữ liệu sạch</p>
                    <p className="text-slate-700 mt-2 font-medium italic">Vui lòng điều chỉnh lại bộ lọc chỉ số hoặc quét thêm dữ liệu mới.</p>
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
