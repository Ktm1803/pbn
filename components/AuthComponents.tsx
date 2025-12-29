
import React, { useState, useEffect, useRef } from 'react';
import { User, PLANS, PlanType, AccessKey, BugReport } from '../types';
import { login, register, requestSubscription, getUsers, approveUser, revokeUser, logout, loginWithSyncCode, createAccessKey, getAccessKeys, deleteAccessKey, loginWithAccessKey, getBugReports, resolveBugReport, deleteBugReport, toggleLockUser } from '../services/authService';
import { Lock, User as UserIcon, Check, CreditCard, Shield, LogOut, Clock, AlertCircle, RefreshCw, Globe, ArrowRight, Download, Upload, Database, Smartphone, Copy, Key, Trash2, Plus, MessageSquare, Send, Bug, UserX, UserCheck, PlusCircle, Loader2 } from 'lucide-react';

// --- LOGIN / REGISTER FORM ---
export const AuthForm: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'sync' | 'key'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [syncCode, setSyncCode] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            if (mode === 'login') {
                const res = login(email, password);
                if (res.success && res.user) onLogin(res.user);
                else setError(res.message);
            } else if (mode === 'register') {
                const res = await register(email, password);
                if (res.success) {
                    alert(res.message);
                    setMode('login');
                } else {
                    setError(res.message);
                }
            } else if (mode === 'sync') {
                const res = loginWithSyncCode(syncCode);
                if (res.success && res.user) {
                    alert(res.message);
                    onLogin(res.user);
                } else {
                    setError(res.message);
                }
            } else if (mode === 'key') {
                const res = loginWithAccessKey(accessKey.trim());
                if (res.success && res.user) {
                    alert(res.message);
                    onLogin(res.user);
                } else {
                    setError(res.message);
                }
            }
        } catch (err) {
            setError("Đã xảy ra lỗi hệ thống trong quá trình xử lý.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/40 overflow-hidden border border-white/10">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter">PBN Hunter Pro</h2>
                    <p className="text-slate-400 text-sm">Công cụ phân tích tên miền chuyên sâu</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {(mode === 'login' || mode === 'register') && (
                        <>
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-1">Email {mode === 'register' && '(Bắt buộc đúng định dạng)'}</label>
                                <input type="email" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-1">Mật khẩu {mode === 'register' && '(Tối thiểu 6 ký tự)'}</label>
                                <input type="password" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                        </>
                    )}

                    {mode === 'sync' && (
                         <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1">Mã đồng bộ (Từ thiết bị cũ)</label>
                            <textarea required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-32 font-mono text-xs" value={syncCode} onChange={e => setSyncCode(e.target.value)} placeholder="Dán mã đồng bộ bắt đầu bằng eyJ..." />
                        </div>
                    )}

                    {mode === 'key' && (
                         <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1">Nhập Key kích hoạt</label>
                            <div className="relative">
                                <input type="text" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono pl-10 uppercase" value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="KEY-XXXX-XXXX" />
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500 italic">* Lưu ý: Login bằng Key cho phép bạn truy cập từ bất kỳ trình duyệt nào mà không cần Email/Pass.</p>
                        </div>
                    )}

                    <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/50 mt-2 flex items-center justify-center gap-3">
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Đang kích hoạt hệ thống...' : (mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : 'Kích hoạt Key')}
                    </button>
                    {loading && mode === 'register' && (
                        <p className="text-[10px] text-center text-blue-400 animate-pulse uppercase font-black tracking-widest mt-2">Đang soạn và gửi email thông báo cho Admin...</p>
                    )}
                </form>

                <div className="mt-6 flex flex-col gap-3 text-center text-sm">
                    {mode === 'login' && (
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setMode('key')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs border border-slate-700 font-bold">Login with Key</button>
                            <button onClick={() => setMode('sync')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs border border-slate-700 font-bold">Sync</button>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-2 mt-2">
                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-slate-400 hover:text-white transition-colors font-medium underline underline-offset-4">
                            {mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Quay lại đăng nhập'}
                        </button>
                        
                        <div className="h-px bg-slate-800 w-full my-2"></div>

                        <a 
                            href="https://t.me/hima_dev" 
                            target="_blank" 
                            className="bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-[#229ED9]/30 transition-all hover:scale-[1.02]"
                        >
                            <Send size={16}/> LIÊN HỆ HỖ TRỢ TELEGRAM
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN DASHBOARD ---
export const AdminDashboard: React.FC<{ onLogout: () => void; onGoToTool: () => void }> = ({ onLogout, onGoToTool }) => {
    const [users, setUsers] = useState<User[]>(getUsers());
    const [keys, setKeys] = useState<AccessKey[]>(getAccessKeys());
    const [bugs, setBugs] = useState<BugReport[]>(getBugReports());
    const [refresh, setRefresh] = useState(0);
    const [tab, setTab] = useState<'users' | 'keys' | 'bugs'>('users');
    const [selectedPlanForNewKey, setSelectedPlanForNewKey] = useState<PlanType>('1_month');

    // Lắng nghe sự kiện đồng bộ từ các tab khác (Khi có user đăng ký ở tab khác)
    useEffect(() => {
        const syncHandler = () => {
            setUsers(getUsers());
            setKeys(getAccessKeys());
            setBugs(getBugReports());
        };
        window.addEventListener('storage_sync', syncHandler);
        return () => window.removeEventListener('storage_sync', syncHandler);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setUsers(getUsers());
            setKeys(getAccessKeys());
            setBugs(getBugReports());
        }, 10000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setUsers(getUsers());
        setKeys(getAccessKeys());
        setBugs(getBugReports());
    }, [refresh]);

    const handleApprove = (email: string) => {
        if(confirm(`Duyệt thanh toán cho ${email}?`)) {
            approveUser(email);
            setRefresh(r => r+1);
        }
    };

    const handleCreateKey = () => {
        const newKey = createAccessKey(selectedPlanForNewKey);
        setRefresh(r => r+1);
    };

    const handleDeleteKey = (code: string) => {
        if(confirm(`Xóa key ${code}?`)) {
            deleteAccessKey(code);
            setRefresh(r => r+1);
        }
    };
        const handleDeleteKey = (code: string) => {
        if(confirm(`remove key ${code}?`)) {
            deleteAccessKey(code);
            setRefresh(r => r+1);
        }
    };

    const handleToggleLock = (email: string, isLocked: boolean) => {
        if (confirm(`${isLocked ? 'Mở khóa' : 'Khóa'} tài khoản ${email}?`)) {
            toggleLockUser(email);
            setRefresh(r => r+1);
        }
    };
        const handleToggleLock = (email: string, isLocked: boolean) => {
        if (confirm(`${isLocked ? 'unlock' : 'lock'} account ${email}?`)) {
            toggleLockUser(email);
            setRefresh(r => r+1);
        }
    };

    const formatExpiry = (expiry?: number) => {
        if (!expiry) return "Chưa kích hoạt";
        if (expiry > 9999999999998) return "Vĩnh viễn";
        const date = new Date(expiry);
        const now = Date.now();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return `${date.toLocaleDateString()} (${diffDays > 0 ? `Còn ${diffDays} ngày` : 'Hết hạn'})`;
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <header className="flex justify-between items-center mb-8 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter"><Shield className="text-red-500"/> ADMIN PANEL</h1>
                    <nav className="flex gap-2">
                        <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Người dùng ({users.filter(u => u.role !== 'admin').length})</button>
                        <button onClick={() => setTab('keys')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === 'keys' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Activation Keys</button>
                        <button onClick={() => setTab('bugs')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === 'bugs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Báo cáo lỗi ({bugs.filter(b => b.status === 'new').length})</button>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onGoToTool} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-900/20 transition-all hover:scale-105">Vào Tool</button>
                    <button onClick={onLogout} className="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-white p-2.5 rounded-xl border border-slate-700 transition-all"><LogOut size={16} /></button>
                </div>
            </header>

            {tab === 'users' && (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <th className="p-6 border-b border-slate-800">User</th>
                                <th className="p-6 border-b border-slate-800">Mã Payment</th>
                                <th className="p-6 border-b border-slate-800">Thời hạn sử dụng</th>
                                <th className="p-6 border-b border-slate-800">Trạng thái</th>
                                <th className="p-6 border-b border-slate-800 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {[...users].filter(u => u.role !== 'admin').reverse().map((u) => (
                                <tr key={u.email} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${u.isLocked ? 'opacity-60 grayscale' : ''}`}>
                                    <td className="p-6">
                                        <div className="font-black text-white">{u.email}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {btoa(u.email).slice(0, 8)}</div>
                                    </td>
                                    <td className="p-6 font-mono text-yellow-500 font-bold">{u.paymentCode}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                            <Clock size={14} className="text-slate-500"/>
                                            {formatExpiry(u.expiryDate)}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black w-fit uppercase tracking-tighter ${u.subscriptionStatus === 'active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : u.subscriptionStatus === 'pending' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/50 animate-pulse' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                                {u.subscriptionStatus}
                                            </span>
                                            {u.isLocked && (
                                                <span className="bg-red-950/40 text-red-400 border border-red-900/50 px-2.5 py-1 rounded-lg text-[10px] font-black w-fit uppercase tracking-tighter">Bị khóa</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.subscriptionStatus === 'pending' && (
                                                <button onClick={() => handleApprove(u.email)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black transition-all">Duyệt</button>
                                            )}
                                            <button 
                                                onClick={() => handleToggleLock(u.email, !!u.isLocked)} 
                                                className={`p-2 rounded-xl transition-all border ${u.isLocked ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/40' : 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40'}`}
                                                title={u.isLocked ? "Mở khóa" : "Khóa tài khoản"}
                                            >
                                                {u.isLocked ? <UserCheck size={16}/> : <UserX size={16}/>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'keys' && (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h3 className="font-black text-white tracking-tighter">QUẢN LÝ KEY KÍCH HOẠT</h3>
                        <div className="flex gap-2">
                             <select value={selectedPlanForNewKey} onChange={e => setSelectedPlanForNewKey(e.target.value as PlanType)} className="bg-slate-800 text-white text-xs rounded-xl px-4 py-2 outline-none font-bold border border-slate-700">
                                {Object.keys(PLANS).map(p => <option key={p} value={p}>{PLANS[p as PlanType].name}</option>)}
                             </select>
                             <button onClick={handleCreateKey} className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg shadow-blue-900/20">Tạo Key Mới</button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <th className="p-6 border-b border-slate-800">Mã Key</th>
                                <th className="p-6 border-b border-slate-800">Gói</th>
                                <th className="p-6 border-b border-slate-800">Trạng thái</th>
                                <th className="p-6 border-b border-slate-800 text-right">Xóa</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {keys.map(k => (
                                <tr key={k.code} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-6 font-mono text-blue-400 font-black tracking-widest">{k.code}</td>
                                    <td className="p-6 font-bold">{PLANS[k.plan].name}</td>
                                    <td className="p-6">
                                        {k.isUsed ? (
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 text-xs flex items-center gap-1"><UserIcon size={12}/> Đã sử dụng bởi:</span>
                                                <span className="text-white font-bold text-xs">{k.usedBy}</span>
                                            </div>
                                        ) : (
                                            <span className="text-emerald-500 font-black text-[10px] uppercase flex items-center gap-1"><PlusCircle size={14}/> Sẵn sàng</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        {!k.isUsed && <button onClick={() => handleDeleteKey(k.code)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'bugs' && (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <th className="p-6 border-b border-slate-800">Người báo cáo</th>
                                <th className="p-6 border-b border-slate-800">Nội dung chi tiết</th>
                                <th className="p-6 border-b border-slate-800">Thời gian gửi</th>
                                <th className="p-6 border-b border-slate-800 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {bugs.map(b => (
                                <tr key={b.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${b.status === 'resolved' ? 'opacity-40' : ''}`}>
                                    <td className="p-6 font-bold text-white">{b.email}</td>
                                    <td className="p-6 whitespace-pre-wrap text-slate-400 text-xs italic">"{b.content}"</td>
                                    <td className="p-6 text-xs font-mono font-bold text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {b.status === 'new' && (
                                                <button onClick={() => { resolveBugReport(b.id); setRefresh(r => r+1); }} className="text-emerald-500 hover:bg-emerald-950/50 p-2 rounded-xl border border-transparent hover:border-emerald-900/50 transition-all"><Check size={20}/></button>
                                            )}
                                            <button onClick={() => { deleteBugReport(b.id); setRefresh(r => r+1); }} className="text-slate-600 hover:text-red-400 p-2 rounded-xl transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bugs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest bg-slate-950/20">Chưa có báo cáo lỗi mới</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- SUBSCRIPTION / PRICING ---
export const SubscriptionPlan: React.FC<{ user: User, onUpdate: () => void, onLogout: () => void }> = ({ user, onUpdate, onLogout }) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

    const handleSubscribe = () => {
        if (selectedPlan) {
            requestSubscription(user.email, selectedPlan);
            onUpdate();
        }
    };

    if (user.subscriptionStatus === 'pending') {
        const planPrice = PLANS[user.plan!].price;
        const qrUrl = `https://img.vietqr.io/image/VCB-cs6-compact.png?amount=${planPrice}&addInfo=${user.paymentCode}&accountName=DO%20NGOC%20THANH`;

        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border-t-4 border-t-yellow-500">
                    <div className="p-6 text-center border-b border-slate-800">
                         <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tighter">THANH TOÁN & KÍCH HOẠT</h2>
                         <p className="text-slate-500 text-xs">Vui lòng quét mã QR bên dưới để bắt đầu</p>
                    </div>
                    <div className="p-8 bg-white flex flex-col items-center">
                        <img src={qrUrl} alt="VietQR" className="w-48 h-48 mb-6 shadow-xl rounded-lg" />
                        <div className="w-full bg-slate-950 p-5 rounded-2xl text-xs space-y-3 text-slate-400 border border-slate-800">
                             <div className="flex justify-between items-center"><span>Ngân hàng</span><span className="text-white font-black">Vietcombank</span></div>
                             <div className="flex justify-between items-center"><span>Số tài khoản</span><span className="text-emerald-400 font-black text-sm tracking-wider">cs6</span></div>
                             <div className="flex justify-between items-center"><span>Số tiền</span><span className="text-white font-black">{planPrice.toLocaleString()}đ</span></div>
                             <div className="flex justify-between items-center bg-yellow-950/20 p-2 rounded-lg border border-yellow-900/30">
                                <span>Nội dung CK</span>
                                <span className="text-yellow-500 font-black text-sm tracking-widest">{user.paymentCode}</span>
                             </div>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-900 flex gap-3">
                        <button onClick={onUpdate} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all"><RefreshCw size={14}/> LÀM MỚI</button>
                        <button onClick={onLogout} className="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-white px-4 py-3 rounded-2xl transition-all border border-slate-700"><LogOut size={16}/></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] pointer-events-none"></div>
             
             <div className="text-center mb-16 relative z-10">
                <div className="inline-block bg-blue-600/10 border border-blue-600/20 px-4 py-1.5 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pricing Plans</div>
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">Mở khóa PBN Hunter Pro</h2>
                <p className="text-slate-400 max-w-xl mx-auto font-medium">Chọn gói hội viên phù hợp để bắt đầu săn lùng những tên miền chất lượng cao nhất cho mạng lưới của bạn.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-24 relative z-10">
                {(Object.keys(PLANS) as PlanType[]).map(key => (
                    <div 
                        key={key} 
                        onClick={() => setSelectedPlan(key)} 
                        className={`group bg-slate-900/50 backdrop-blur-sm p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden ${selectedPlan === key ? 'border-blue-600 bg-slate-900 shadow-[0_20px_50px_rgba(37,99,235,0.1)] scale-105' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'}`}
                    >
                        {key === '1_year' && (
                            <div className="absolute top-6 right-[-35px] bg-emerald-600 text-white text-[9px] font-black py-1 px-10 rotate-45 shadow-lg">BEST VALUE</div>
                        )}
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{PLANS[key].name}</h3>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-black text-blue-500">{(PLANS[key].price / 1000).toLocaleString()}k</span>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">/ VNĐ</span>
                        </div>
                        
                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                                <Check size={16} className="text-blue-500 bg-blue-500/10 rounded-full p-0.5"/> 
                                Full quyền quét 10k domain/lần
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                                <Check size={16} className="text-blue-500 bg-blue-500/10 rounded-full p-0.5"/> 
                                AI Audit không giới hạn
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                                <Check size={16} className="text-blue-500 bg-blue-500/10 rounded-full p-0.5"/> 
                                Support VIP 24/7
                            </div>
                        </div>

                        <button className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedPlan === key ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                            {selectedPlan === key ? 'Đã chọn gói' : 'Chọn gói này'}
                        </button>
                    </div>
                ))}
             </div>

             {selectedPlan && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50 animate-in fade-in slide-in-from-bottom-10">
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-blue-500/50 p-6 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Thanh toán cho gói:</span>
                            <span className="text-white font-black text-xl uppercase tracking-tighter">{PLANS[selectedPlan].name} — <span className="text-blue-500">{PLANS[selectedPlan].price.toLocaleString()}đ</span></span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedPlan(null)} className="text-slate-500 font-black text-xs uppercase hover:text-white px-4 transition-colors">Hủy</button>
                            <button onClick={handleSubscribe} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-900/30 transition-all hover:scale-105 active:scale-95">
                                <CreditCard size={16}/> TIẾP TỤC THANH TOÁN
                            </button>
                        </div>
                    </div>
                </div>
             )}
             <button onClick={onLogout} className="mt-8 text-slate-600 hover:text-slate-400 font-bold text-xs uppercase tracking-widest transition-colors">Đăng xuất khỏi tài khoản</button>
        </div>
    );
};
