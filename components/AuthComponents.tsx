
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
        alert("Yêu cầu kích hoạt gói đã được gửi. Vui lòng liên hệ Admin qua Telegram @hima_dev để hoàn tất thanh toán.");
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black text-white mb-4">Nâng Cấp Tài Khoản</h2>
                    <p className="text-slate-400">Chọn gói phù hợp để bắt đầu săn tìm PBN chất lượng cao</p>
                    {user.subscriptionStatus === 'pending' && (
                        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl text-yellow-500 font-bold flex items-center justify-center gap-2">
                            <Clock size={20}/> Yêu cầu kích hoạt gói "{PLANS[user.plan!].name}" đang chờ xử lý...
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {(Object.keys(PLANS) as PlanType[]).map((key) => (
                        <div key={key} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex flex-col h-full hover:border-blue-500/50 transition-all shadow-xl group">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{PLANS[key].name}</h3>
                                <div className="text-3xl font-black text-blue-500">{PLANS[key].price.toLocaleString()}đ</div>
                                <div className="text-slate-500 text-xs mt-1 uppercase font-bold">{PLANS[key].durationDays} ngày sử dụng</div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-400">
                                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> Thu thập domain không giới hạn</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> Full Metrics: DR, UR, TF, CF</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> AI Audit chuyên sâu</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> Xuất dữ liệu CSV</li>
                            </ul>
                            <button 
                                onClick={() => handleSelectPlan(key)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 group-hover:scale-105"
                            >
                                CHỌN GÓI NÀY
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center flex flex-col items-center gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg">
                        <p className="text-sm text-slate-400 mb-4">Mã thanh toán của bạn: <b className="text-white font-mono">{user.paymentCode}</b></p>
                        <a 
                            href="https://t.me/hima_dev" 
                            target="_blank" 
                            className="inline-flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-xl font-black text-white hover:bg-blue-500 transition-all"
                        >
                            <Send size={18}/> GỬI MÃ KÍCH HOẠT QUA TELEGRAM
                        </a>
                    </div>
                    <button onClick={onLogout} className="text-slate-500 hover:text-white flex items-center gap-2 font-bold transition-colors">
                        <LogOut size={18}/> Đăng xuất
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
            <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-12 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-red-600 p-2 rounded-xl text-white"><Shield size={24}/></div>
                    <h2 className="text-2xl font-black text-white">ADMIN <span className="text-red-500">CONTROL</span></h2>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onGoToTool} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all"><Database size={18}/> VÀO TOOL</button>
                    <button onClick={onLogout} className="bg-slate-800 text-slate-400 p-2 rounded-xl border border-slate-700 hover:text-white transition-all"><LogOut size={20}/></button>
                </div>
            </header>

            <main className="p-12 max-w-[1600px] mx-auto">
                <div className="flex gap-4 mb-8">
                    {['users', 'keys', 'bugs'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab === 'users' ? 'Người dùng' : tab === 'keys' ? 'Mã Access Key' : 'Báo cáo lỗi'}
                        </button>
                    ))}
                </div>

                {activeTab === 'users' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                <tr>
                                    <th className="p-6">User / Email</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6">Plan</th>
                                    <th className="p-6">Hết hạn</th>
                                    <th className="p-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {users.map(u => (
                                    <tr key={u.email} className="hover:bg-slate-800/30">
                                        <td className="p-6">
                                            <div className="font-bold text-white">{u.email}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {u.paymentCode}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${u.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : u.subscriptionStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-500'}`}>
                                                {u.subscriptionStatus}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-slate-300">{u.plan ? PLANS[u.plan].name : 'N/A'}</td>
                                        <td className="p-6 text-xs text-slate-500 font-mono">{u.expiryDate ? new Date(u.expiryDate).toLocaleDateString() : '∞'}</td>
                                        <td className="p-6 text-right space-x-2">
                                            <button onClick={() => toggleLockUser(u.email)} className={`p-2 rounded-lg transition-all ${u.isLocked ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-red-500'}`} title={u.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}>
                                                {u.isLocked ? <UserCheck size={18}/> : <UserX size={18}/>}
                                            </button>
                                            {u.subscriptionStatus !== 'active' ? (
                                                <button onClick={() => approveUser(u.email)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-500">Active</button>
                                            ) : (
                                                <button onClick={() => revokeUser(u.email)} className="bg-slate-800 text-red-500 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700 hover:bg-red-950">Revoke</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'keys' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 mb-8">
                            {(Object.keys(PLANS) as PlanType[]).map(p => (
                                <button key={p} onClick={() => handleCreateKey(p)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><PlusCircle size={18}/> Tạo Key {PLANS[p].name}</button>
                            ))}
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                    <tr>
                                        <th className="p-6">Access Key</th>
                                        <th className="p-6">Gói</th>
                                        <th className="p-6">Tình trạng</th>
                                        <th className="p-6">Người dùng</th>
                                        <th className="p-6 text-right">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {keys.map(k => (
                                        <tr key={k.code}>
                                            <td className="p-6 font-mono font-bold text-blue-400">{k.code}</td>
                                            <td className="p-6 text-sm font-bold text-slate-300">{PLANS[k.plan].name}</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${k.isUsed ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {k.isUsed ? 'Đã dùng' : 'Chưa dùng'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-xs text-slate-500">{k.usedBy || '-'}</td>
                                            <td className="p-6 text-right">
                                                <button onClick={() => { deleteAccessKey(k.code); setKeys(getAccessKeys()); }} className="text-slate-500 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'bugs' && (
                    <div className="grid grid-cols-1 gap-4">
                        {bugs.length === 0 && <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">Không có báo cáo lỗi nào.</div>}
                        {bugs.map(b => (
                            <div key={b.id} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex justify-between items-start gap-8">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${b.status === 'new' ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>{b.status}</span>
                                        <span className="text-sm font-bold text-white">{b.email}</span>
                                        <span className="text-xs text-slate-500 font-mono">{new Date(b.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-slate-300 bg-slate-950 p-6 rounded-2xl border border-slate-800 font-medium leading-relaxed">{b.content}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {b.status === 'new' && (
                                        <button onClick={() => { resolveBugReport(b.id); setBugs(getBugReports()); }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 transition-all"><Check size={18}/> XONG</button>
                                    )}
                                    <button onClick={() => { deleteBugReport(b.id); setBugs(getBugReports()); }} className="bg-slate-800 text-slate-400 px-6 py-3 rounded-xl font-bold border border-slate-700 hover:text-red-500 transition-all">Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
