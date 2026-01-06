
import React, { useState, useEffect } from 'react';
import { User, PLANS, PlanType, AccessKey, BugReport } from '../types';
import { login, register, requestSubscription, getUsers, approveUser, revokeUser, logout, loginWithSyncCode, createAccessKey, getAccessKeys, deleteAccessKey, loginWithAccessKey, getBugReports, resolveBugReport, deleteBugReport, toggleLockUser, loginWithGoogle } from '../services/authService';
import { Lock, User as UserIcon, Check, CreditCard, Shield, LogOut, Clock, AlertCircle, RefreshCw, Globe, ArrowRight, Download, Upload, Database, Smartphone, Copy, Key, Trash2, Plus, MessageSquare, Send, Bug, UserX, UserCheck, PlusCircle, Loader2, ShieldCheck, X } from 'lucide-react';

// --- LOGIN / REGISTER FORM ---
export const AuthForm: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'sync' | 'key'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [syncCode, setSyncCode] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            const res = await loginWithGoogle();
            if (res.success && res.user) {
                onLogin(res.user);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi kết nối với Google.");
        } finally {
            setGoogleLoading(false);
        }
    };

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

                {(mode === 'login' || mode === 'register') && (
                    <div className="mb-6">
                        <button 
                            type="button"
                            disabled={googleLoading}
                            onClick={handleGoogleLogin}
                            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-white shadow-lg active:scale-95 disabled:opacity-70"
                        >
                            {googleLoading ? (
                                <Loader2 size={20} className="animate-spin text-blue-600" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            )}
                            {googleLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}
                        </button>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900 px-2 text-slate-500 font-bold">Hoặc đăng nhập với Mail</span>
                            </div>
                        </div>
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

// --- SUBSCRIPTION PLAN COMPONENT ---
export const SubscriptionPlan: React.FC<{ user: User, onUpdate: () => void, onLogout: () => void }> = ({ user, onUpdate, onLogout }) => {
    const handleSelectPlan = async (planKey: PlanType) => {
        requestSubscription(user.email, planKey);
        onUpdate();
    };

    if (user.subscriptionStatus === 'pending') {
        const planPrice = PLANS[user.plan!].price;
        // Tạo URL mã QR VietQR chuẩn
        const qrUrl = `https://img.vietqr.io/image/VCB-cs6-compact.png?amount=${planPrice}&addInfo=${user.paymentCode}&accountName=DO%20NGOC%20THANH`;

        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border-t-4 border-t-blue-500 animate-in zoom-in-95 duration-300">
                    <div className="p-8 text-center border-b border-slate-800 bg-slate-900/50">
                         <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">QUÉT MÃ THANH TOÁN</h2>
                         <p className="text-slate-500 text-xs font-medium">Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền</p>
                    </div>
                    
                    <div className="p-10 bg-white flex flex-col items-center relative">
                        <div className="absolute top-2 right-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">VietQR Powered</div>
                        <img src={qrUrl} alt="VietQR Payment" className="w-56 h-56 mb-8 shadow-2xl rounded-2xl border-4 border-slate-50" />
                        
                        <div className="w-full bg-slate-50 p-6 rounded-3xl text-[11px] space-y-4 text-slate-600 border border-slate-100 shadow-inner">
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                <span>Ngân hàng</span>
                                <span className="text-slate-900 font-black">Vietcombank</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                <span>Số tài khoản</span>
                                <span className="text-blue-600 font-black text-base tracking-wider">cs6</span>
                             </div>
                             <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                <span>Số tiền</span>
                                <span className="text-slate-900 font-black text-sm">{planPrice.toLocaleString()} VNĐ</span>
                             </div>
                             <div className="flex justify-between items-center bg-blue-600/5 p-3 rounded-2xl border border-blue-600/10">
                                <span className="font-bold">Nội dung CK</span>
                                <span className="text-blue-600 font-black text-base tracking-widest uppercase">{user.paymentCode}</span>
                             </div>
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-900">
                        <a 
                            href="https://t.me/hima_dev" 
                            target="_blank" 
                            className="w-full bg-[#229ED9] hover:bg-[#229ED9]/90 text-white py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-3 border border-white/10 shadow-xl shadow-[#229ED9]/20 transition-all hover:scale-[1.03] active:scale-95"
                        >
                            <Send size={18}/> XÁC NHẬN QUA TELEGRAM
                        </a>
                        
                        <div className="flex gap-4 mt-6">
                            <button onClick={onUpdate} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 border border-slate-700 transition-all"><RefreshCw size={14}/> LÀM MỚI TRẠNG THÁI</button>
                            <button onClick={onLogout} className="bg-slate-950 hover:bg-red-950/30 text-slate-500 hover:text-red-500 p-3 rounded-2xl transition-all border border-slate-800"><LogOut size={18}/></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] pointer-events-none"></div>
            
            <div className="max-w-5xl w-full relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-block bg-blue-600/10 border border-blue-600/20 px-6 py-2 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 phoenix-glow">V.I.P Member Plans</div>
                    <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">Nâng Cấp PBN Hunter Pro</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">Sở hữu những tên miền chất lượng cao nhất với đầy đủ chỉ số SEO và lịch sử sạch. Chọn gói hội viên để bắt đầu ngay.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {(Object.keys(PLANS) as PlanType[]).map((key) => (
                        <div 
                            key={key} 
                            className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] flex flex-col h-full hover:border-blue-500/50 transition-all shadow-2xl group cursor-pointer relative overflow-hidden" 
                            onClick={() => handleSelectPlan(key)}
                        >
                            {key === '1_year' && (
                                <div className="absolute top-6 right-[-40px] bg-blue-600 text-white text-[9px] font-black py-1.5 px-12 rotate-45 shadow-lg">KHUYÊN DÙNG</div>
                            )}
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{PLANS[key].name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-blue-500 tracking-tighter">{PLANS[key].price.toLocaleString()}</span>
                                    <span className="text-slate-600 font-black text-xs uppercase tracking-widest">VNĐ</span>
                                </div>
                                <div className="text-slate-500 text-[10px] mt-2 uppercase font-black tracking-[0.2em]">{PLANS[key].durationDays} ngày truy cập full quyền</div>
                            </div>
                            
                            <ul className="space-y-5 mb-12 flex-1 text-sm text-slate-400">
                                <li className="flex items-center gap-3 font-bold group-hover:text-slate-200 transition-colors"><Check size={20} className="text-emerald-500 bg-emerald-500/10 rounded-full p-1"/> Quét domain không giới hạn</li>
                                <li className="flex items-center gap-3 font-bold group-hover:text-slate-200 transition-colors"><Check size={20} className="text-emerald-500 bg-emerald-500/10 rounded-full p-1"/> Full Metrics Ahrefs/Majestic</li>
                                <li className="flex items-center gap-3 font-bold group-hover:text-slate-200 transition-colors"><Check size={20} className="text-emerald-500 bg-emerald-500/10 rounded-full p-1"/> AI Audit & Quality Control</li>
                                <li className="flex items-center gap-3 font-bold group-hover:text-slate-200 transition-colors"><Check size={20} className="text-emerald-500 bg-emerald-500/10 rounded-full p-1"/> Xuất dữ liệu CSV/JSON</li>
                            </ul>
                            
                            <button 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 active:scale-95 group-hover:scale-[1.02]"
                            >
                                CHỌN GÓI NÀY
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center flex flex-col items-center gap-8">
                    <div className="flex items-center gap-10 opacity-40">
                        <div className="flex items-center gap-2"><Smartphone size={16}/> Sync All Devices</div>
                        <div className="flex items-center gap-2"><ShieldCheck size={16}/> Secure Payment</div>
                        <div className="flex items-center gap-2"><Clock size={16}/> 24/7 VIP Support</div>
                    </div>
                    
                    <div className="h-px bg-slate-800 w-full max-w-md"></div>
                    
                    <button onClick={onLogout} className="text-slate-600 hover:text-red-500 flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em] transition-all hover:gap-4">
                        <LogOut size={16}/> Đăng xuất khỏi phiên làm việc
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN DASHBOARD COMPONENT ---
export const AdminDashboard: React.FC<{ onLogout: () => void, onGoToTool: () => void }> = ({ onLogout, onGoToTool }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [keys, setKeys] = useState<AccessKey[]>([]);
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'bugs'>('users');

    useEffect(() => {
        const load = () => {
            setUsers(getUsers());
            setKeys(getAccessKeys());
            setBugs(getBugReports());
        };
        load();
        window.addEventListener('storage_sync', load);
        return () => window.removeEventListener('storage_sync', load);
    }, []);

    const handleCreateKey = (plan: PlanType) => {
        createAccessKey(plan);
        setKeys(getAccessKeys());
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <header className="h-24 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-12 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-red-600 p-3 rounded-2xl text-white shadow-xl shadow-red-900/20"><Shield size={24}/></div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-white tracking-tighter leading-none">ADMIN <span className="text-red-500">CONTROL</span></h2>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Management System</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onGoToTool} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-500 transition-all hover:scale-105 shadow-xl shadow-blue-900/20"><Database size={20}/> VÀO TOOL</button>
                    <button onClick={onLogout} className="bg-slate-800 text-slate-400 p-3 rounded-2xl border border-slate-700 hover:text-white transition-all hover:bg-red-950/30 hover:border-red-900/50"><LogOut size={22}/></button>
                </div>
            </header>

            <main className="p-12 max-w-[1700px] mx-auto">
                <div className="flex gap-4 mb-10">
                    {['users', 'keys', 'bugs'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700'}`}
                        >
                            {tab === 'users' ? `Hội viên (${users.length})` : tab === 'keys' ? 'Activation Keys' : `Support (${bugs.filter(b => b.status === 'new').length})`}
                        </button>
                    ))}
                </div>

                {activeTab === 'users' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">
                                <tr>
                                    <th className="p-8">Thành viên</th>
                                    <th className="p-8">Trạng thái Sub</th>
                                    <th className="p-8">Gói hội viên</th>
                                    <th className="p-8">Ngày hết hạn</th>
                                    <th className="p-8 text-right">Quản lý</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {[...users].reverse().map(u => (
                                    <tr key={u.email} className={`hover:bg-slate-800/30 transition-colors ${u.isLocked ? 'opacity-40 grayscale bg-red-950/10' : ''}`}>
                                        <td className="p-8">
                                            <div className="font-black text-white text-lg">{u.email}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1 font-bold">PAYMENT CODE: {u.paymentCode}</div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter w-fit border ${u.subscriptionStatus === 'active' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : u.subscriptionStatus === 'pending' ? 'bg-yellow-950/40 text-yellow-500 border-yellow-900/50 animate-pulse' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                                    {u.subscriptionStatus}
                                                </span>
                                                {u.isLocked && <span className="bg-red-600 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase w-fit">Locked Account</span>}
                                            </div>
                                        </td>
                                        <td className="p-8 text-sm font-black text-slate-200">{u.plan ? PLANS[u.plan].name : 'Chưa đăng ký'}</td>
                                        <td className="p-8 text-xs text-slate-500 font-mono font-bold">
                                            {u.expiryDate ? (
                                                <div className="flex items-center gap-2 text-blue-400">
                                                    <Clock size={14}/> {new Date(u.expiryDate).toLocaleDateString()}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => toggleLockUser(u.email)} className={`p-3 rounded-2xl transition-all border ${u.isLocked ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-red-500 hover:bg-red-950/30 hover:border-red-900/50'}`} title={u.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}>
                                                    {u.isLocked ? <UserCheck size={20}/> : <UserX size={20}/>}
                                                </button>
                                                {u.subscriptionStatus !== 'active' ? (
                                                    <button onClick={() => approveUser(u.email)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase hover:bg-emerald-500 shadow-xl shadow-emerald-900/30 transition-all hover:scale-105">DUYỆT</button>
                                                ) : (
                                                    <button onClick={() => revokeUser(u.email)} className="bg-slate-800 text-red-500 px-6 py-3 rounded-2xl text-xs font-black uppercase border border-slate-700 hover:bg-red-950/40 hover:border-red-900/50 transition-all">HỦY SUB</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'keys' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(Object.keys(PLANS) as PlanType[]).map(p => (
                                <button key={p} onClick={() => handleCreateKey(p)} className="bg-slate-900 border border-slate-800 hover:border-blue-500 hover:bg-blue-600/10 text-slate-300 hover:text-blue-400 px-8 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl"><PlusCircle size={22}/> Tạo Key {PLANS[p].name}</button>
                            ))}
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">
                                    <tr>
                                        <th className="p-8">Mã kích hoạt (Key)</th>
                                        <th className="p-8">Loại gói</th>
                                        <th className="p-8">Tình trạng</th>
                                        <th className="p-8">Kích hoạt bởi</th>
                                        <th className="p-8 text-right">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {keys.map(k => (
                                        <tr key={k.code} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-8 font-mono font-black text-blue-400 tracking-[0.2em] text-lg">{k.code}</td>
                                            <td className="p-8 text-sm font-black text-slate-200">{PLANS[k.plan].name}</td>
                                            <td className="p-8">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${k.isUsed ? 'bg-red-950/40 text-red-500 border-red-900/50' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'}`}>
                                                    {k.isUsed ? 'Đã kích hoạt' : 'Sẵn sàng dùng'}
                                                </span>
                                            </td>
                                            <td className="p-8 text-xs text-slate-500 font-bold">{k.usedBy || '---'}</td>
                                            <td className="p-8 text-right">
                                                <button onClick={() => { deleteAccessKey(k.code); setKeys(getAccessKeys()); }} className="text-slate-600 hover:text-red-500 transition-all p-3 bg-slate-800/50 rounded-2xl hover:bg-red-950/30 border border-transparent hover:border-red-900/50"><Trash2 size={20}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {keys.length === 0 && (
                                        <tr><td colSpan={5} className="p-32 text-center text-slate-700 font-black uppercase tracking-widest bg-slate-950/20">Chưa có mã Key kích hoạt nào được tạo</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'bugs' && (
                    <div className="grid grid-cols-1 gap-8">
                        {bugs.length === 0 && <div className="p-40 text-center text-slate-700 font-black uppercase tracking-[0.4em] bg-slate-900 rounded-[3rem] border border-slate-800">Inbox trống - Hệ thống vận hành ổn định</div>}
                        {[...bugs].reverse().map(b => (
                            <div key={b.id} className={`bg-slate-900 border border-slate-800 p-10 rounded-[3rem] flex justify-between items-start gap-10 shadow-2xl transition-all ${b.status === 'resolved' ? 'opacity-30 grayscale' : 'hover:border-blue-500/40'}`}>
                                <div className="space-y-6 flex-1">
                                    <div className="flex items-center gap-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${b.status === 'new' ? 'bg-red-950 text-red-400 border-red-900 shadow-lg shadow-red-950/20' : 'bg-emerald-950/40 text-emerald-500 border-emerald-900'}`}>{b.status === 'new' ? 'CHƯA XỬ LÝ' : 'ĐÃ GIẢI QUYẾT'}</span>
                                        <span className="text-lg font-black text-white">{b.email}</span>
                                        <span className="text-xs text-slate-500 font-mono font-bold flex items-center gap-2"><Clock size={14}/> {new Date(b.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-slate-950 p-8 rounded-[2rem] border border-slate-800/50 shadow-inner">
                                        <p className="text-slate-300 font-medium text-base leading-relaxed whitespace-pre-wrap">{b.content}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {b.status === 'new' && (
                                        <button onClick={() => { resolveBugReport(b.id); setBugs(getBugReports()); }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95">HOÀN TẤT XỬ LÝ</button>
                                    )}
                                    <button onClick={() => { deleteBugReport(b.id); setBugs(getBugReports()); }} className="bg-slate-800 text-slate-500 px-8 py-4 rounded-2xl font-black text-xs uppercase border border-slate-700 hover:text-red-500 hover:bg-red-950/30 hover:border-red-900/50 transition-all">GỠ BÁO CÁO</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
