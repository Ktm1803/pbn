
import React, { useState, useEffect, useRef } from 'react';
import { User, PLANS, PlanType, AccessKey, BugReport } from '../types';
import { login, register, requestSubscription, getUsers, approveUser, revokeUser, logout, importUsers, loginWithSyncCode, generateSyncCode, createAccessKey, getAccessKeys, deleteAccessKey, loginWithAccessKey, getBugReports, resolveBugReport, deleteBugReport } from '../services/authService';
import { Lock, User as UserIcon, Check, CreditCard, Shield, LogOut, Clock, AlertCircle, RefreshCw, Globe, ArrowRight, Download, Upload, Database, Smartphone, Copy, Key, Trash2, Plus, MessageSquare, Send, Bug } from 'lucide-react';

// --- LOGIN / REGISTER FORM ---
export const AuthForm: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'sync' | 'key'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [syncCode, setSyncCode] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (mode === 'login') {
            const user = login(email, password);
            if (user) onLogin(user);
            else setError("Email hoặc mật khẩu không đúng.");
        } else if (mode === 'register') {
            const res = register(email, password);
            if (res.success) {
                alert("Đăng ký thành công! Vui lòng đăng nhập.");
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
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/40">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">PBN Hunter Pro</h2>
                    <p className="text-slate-400">Công cụ phân tích tên miền chuyên sâu</p>
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
                                <label className="block text-slate-400 text-sm font-medium mb-1">Email</label>
                                <input type="email" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-1">Mật khẩu</label>
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
                            <label className="block text-slate-400 text-sm font-medium mb-1">Nhập Key</label>
                            <div className="relative">
                                <input type="text" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono pl-10 uppercase" value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="KEY-XXXX-XXXX" />
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/50 mt-2">
                        Tiếp tục
                    </button>
                </form>

                <div className="mt-6 flex flex-col gap-3 text-center text-sm">
                    {mode === 'login' && (
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setMode('key')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs border border-slate-700">Login Key</button>
                            <button onClick={() => setMode('sync')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs border border-slate-700">Sync</button>
                        </div>
                    )}
                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-slate-400 hover:text-white transition-colors">
                        {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Quay lại đăng nhập'}
                    </button>
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setUsers(getUsers());
            setKeys(getAccessKeys());
            setBugs(getBugReports());
        }, 5000);
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

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <header className="flex justify-between items-center mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="text-red-500"/> Admin</h1>
                    <nav className="flex gap-4">
                        <button onClick={() => setTab('users')} className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${tab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Người dùng</button>
                        <button onClick={() => setTab('keys')} className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${tab === 'keys' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Keys</button>
                        <button onClick={() => setTab('bugs')} className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${tab === 'bugs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Báo cáo lỗi ({bugs.filter(b => b.status === 'new').length})</button>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onGoToTool} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Vào Tool</button>
                    <button onClick={onLogout} className="bg-red-900/80 hover:bg-red-800 text-white p-2 rounded-lg"><LogOut size={16} /></button>
                </div>
            </header>

            {tab === 'users' && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-800">Email</th>
                                <th className="p-4 border-b border-slate-800">Payment</th>
                                <th className="p-4 border-b border-slate-800">Trạng thái</th>
                                <th className="p-4 border-b border-slate-800 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {users.filter(u => u.role !== 'admin').map((u) => (
                                <tr key={u.email} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-white">{u.email}</td>
                                    <td className="p-4 font-mono text-yellow-400">{u.paymentCode}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${u.subscriptionStatus === 'active' ? 'bg-green-900/20 text-green-400' : u.subscriptionStatus === 'pending' ? 'bg-yellow-900/20 text-yellow-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                            {u.subscriptionStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.subscriptionStatus === 'pending' && <button onClick={() => handleApprove(u.email)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Duyệt</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'keys' && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-white">Quản lý Keys</h3>
                        <div className="flex gap-2">
                             <select value={selectedPlanForNewKey} onChange={e => setSelectedPlanForNewKey(e.target.value as PlanType)} className="bg-slate-800 text-white text-xs rounded px-2 py-1 outline-none">
                                {Object.keys(PLANS).map(p => <option key={p} value={p}>{PLANS[p as PlanType].name}</option>)}
                             </select>
                             <button onClick={handleCreateKey} className="bg-emerald-600 px-3 py-1 rounded text-xs font-bold text-white">Tạo Key</button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <tbody className="text-sm text-slate-300">
                            {keys.map(k => (
                                <tr key={k.code} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-4 font-mono text-yellow-400 font-bold">{k.code}</td>
                                    <td className="p-4">{PLANS[k.plan].name}</td>
                                    <td className="p-4">{k.isUsed ? <span className="text-slate-600">Đã dùng ({k.usedBy})</span> : <span className="text-green-500">Chưa dùng</span>}</td>
                                    <td className="p-4 text-right">
                                        {!k.isUsed && <button onClick={() => handleDeleteKey(k.code)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'bugs' && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-800">Người báo</th>
                                <th className="p-4 border-b border-slate-800">Nội dung</th>
                                <th className="p-4 border-b border-slate-800">Thời gian</th>
                                <th className="p-4 border-b border-slate-800 text-right">Xử lý</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {bugs.map(b => (
                                <tr key={b.id} className={`border-b border-slate-800 hover:bg-slate-800/50 ${b.status === 'resolved' ? 'opacity-50' : ''}`}>
                                    <td className="p-4">{b.email}</td>
                                    <td className="p-4 whitespace-pre-wrap">{b.content}</td>
                                    <td className="p-4 text-xs font-mono">{new Date(b.createdAt).toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {b.status === 'new' && <button onClick={() => { resolveBugReport(b.id); setRefresh(r => r+1); }} className="text-emerald-500 hover:text-emerald-400"><Check size={18}/></button>}
                                            <button onClick={() => { deleteBugReport(b.id); setRefresh(r => r+1); }} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bugs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Chưa có báo cáo lỗi nào.</td></tr>}
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                    <div className="p-6 text-center border-b border-slate-800">
                         <h2 className="text-xl font-bold text-white mb-1">Thanh toán & Kích hoạt</h2>
                    </div>
                    <div className="p-6 bg-white flex flex-col items-center">
                        <img src={qrUrl} alt="VietQR" className="w-48 h-48 mb-4" />
                        <div className="w-full bg-slate-900 p-4 rounded-lg text-xs space-y-2 text-slate-300">
                             <div className="flex justify-between"><span>Số tài khoản</span><span className="text-red-500 font-bold">cs6</span></div>
                             <div className="flex justify-between"><span>Nội dung CK</span><span className="text-yellow-400 font-bold">{user.paymentCode}</span></div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-900 text-center grid grid-cols-2 gap-2">
                        <button onClick={onUpdate} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2"><RefreshCw size={14}/> Làm mới</button>
                        <button onClick={onLogout} className="bg-red-900/20 text-red-400 py-2 rounded text-sm font-bold flex items-center justify-center gap-2 border border-red-900/30"><LogOut size={14}/> Đăng xuất</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
             <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Mở khóa PBN Hunter Pro</h2>
                <p className="text-slate-400">Chọn gói phù hợp để bắt đầu săn lùng domain expired chất lượng.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-20">
                {(Object.keys(PLANS) as PlanType[]).map(key => (
                    <div key={key} onClick={() => setSelectedPlan(key)} className={`bg-slate-900 p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan === key ? 'border-blue-500 shadow-xl' : 'border-slate-800 hover:border-slate-700'}`}>
                        <h3 className="text-xl font-bold text-white mb-2">{PLANS[key].name}</h3>
                        <div className="text-3xl font-bold text-blue-400 mb-6">{PLANS[key].price.toLocaleString()}đ</div>
                        <button className={`w-full py-3 rounded-lg font-bold ${selectedPlan === key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Chọn Gói</button>
                    </div>
                ))}
             </div>
             {selectedPlan && (
                <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-6 shadow-2xl flex items-center justify-center gap-10">
                    <div className="text-white font-bold text-xl">{PLANS[selectedPlan].name} - {PLANS[selectedPlan].price.toLocaleString()}đ</div>
                    <button onClick={handleSubscribe} className="bg-green-600 hover:bg-green-500 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2"><Check/> Xác nhận đăng ký</button>
                </div>
             )}
        </div>
    );
};
