
import React, { useState, useEffect, useRef } from 'react';
import { User, PLANS, PlanType, AccessKey } from '../types';
import { login, register, requestSubscription, getUsers, approveUser, revokeUser, logout, importUsers, loginWithSyncCode, generateSyncCode, createAccessKey, getAccessKeys, deleteAccessKey, loginWithAccessKey } from '../services/authService';
import { Lock, User as UserIcon, Check, CreditCard, Shield, LogOut, Clock, AlertCircle, RefreshCw, Globe, ArrowRight, Download, Upload, Database, Smartphone, Copy, Key, Trash2, Plus } from 'lucide-react';

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
             {/* Background decoration */}
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
                                <input 
                                    type="email" 
                                    required 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-1">Mật khẩu</label>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </>
                    )}

                    {mode === 'sync' && (
                         <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1">Mã đồng bộ (Từ thiết bị cũ)</label>
                            <textarea
                                required 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-32 font-mono text-xs"
                                value={syncCode}
                                onChange={e => setSyncCode(e.target.value)}
                                placeholder="Dán mã đồng bộ bắt đầu bằng eyJ..."
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Trên thiết bị cũ, vào mục <b>Tài khoản {'>'} Đồng bộ</b> để lấy mã.
                            </p>
                        </div>
                    )}

                    {mode === 'key' && (
                         <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1">Nhập Key (Do Admin cấp)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono pl-10 uppercase"
                                    value={accessKey}
                                    onChange={e => setAccessKey(e.target.value)}
                                    placeholder="KEY-XXXX-XXXX"
                                />
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Nhập key để đăng nhập và kích hoạt tài khoản ngay lập tức.
                            </p>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/50 mt-2">
                        {mode === 'login' ? 'Đăng Nhập' : mode === 'register' ? 'Đăng Ký Tài Khoản' : mode === 'key' ? 'Đăng Nhập Bằng Key' : 'Khôi Phục Tài Khoản'}
                    </button>
                </form>

                <div className="mt-6 flex flex-col gap-3 text-center text-sm">
                    {mode === 'login' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setMode('key')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs border border-slate-700">
                                    <Key size={14}/> Login bằng Key
                                </button>
                                <button onClick={() => setMode('sync')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs border border-slate-700">
                                    <Smartphone size={14}/> Sync thiết bị
                                </button>
                            </div>
                            <div className="border-t border-slate-800 pt-3 mt-1">
                                <button onClick={() => setMode('register')} className="text-slate-400 hover:text-white transition-colors">
                                    Chưa có tài khoản? <span className="text-blue-400">Đăng ký ngay</span>
                                </button>
                            </div>
                        </>
                    )}
                    {(mode === 'register' || mode === 'sync' || mode === 'key') && (
                        <button onClick={() => setMode('login')} className="text-slate-400 hover:text-white transition-colors">
                            Quay lại <span className="text-blue-400">Đăng nhập thường</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SYNC MODAL ---
export const SyncModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const code = generateSyncCode(user.email);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <LogOut className="rotate-180" size={20} />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-900/50 p-3 rounded-full">
                        <Smartphone className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Đồng bộ thiết bị</h3>
                </div>

                <p className="text-slate-300 text-sm mb-4">
                    Sao chép mã dưới đây và dán vào phần <b>"Đăng nhập bằng thiết bị khác"</b> trên trình duyệt mới để sử dụng tài khoản của bạn.
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 relative group">
                    <pre className="text-xs text-slate-400 font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                        {code}
                    </pre>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded shadow transition-all opacity-0 group-hover:opacity-100"
                        title="Sao chép"
                    >
                        {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                    </button>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold">
                        Đóng
                    </button>
                </div>
            </div>
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
        // Using 'cs6' as requested
        const qrUrl = `https://img.vietqr.io/image/VCB-cs6-compact.png?amount=${planPrice}&addInfo=${user.paymentCode}&accountName=DO%20NGOC%20THANH`;

        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                    <div className="p-6 text-center border-b border-slate-800">
                         <h2 className="text-xl font-bold text-white mb-1">Ủng hộ tác giả</h2>
                         <p className="text-slate-400 text-sm">Cảm ơn sự đồng hành của bạn!</p>
                    </div>
                    
                    <div className="p-6 bg-white flex flex-col items-center justify-center">
                        <div className="border-2 border-slate-200 p-2 rounded-xl mb-4">
                            <img src={qrUrl} alt="VietQR Payment" className="w-48 h-48 object-contain" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-blue-900 text-lg">Vietcombank</span>
                        </div>
                        <div className="w-full bg-slate-900 p-4 rounded-lg text-sm space-y-3 text-slate-300">
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500">Ngân hàng</span>
                                <span className="font-bold text-white">Vietcombank</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500">Chi nhánh</span>
                                <span className="font-bold text-white">HÀ NỘI</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500">Chủ tài khoản</span>
                                <span className="font-bold text-white uppercase">DO NGOC THANH</span>
                             </div>
                             <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                <span className="text-slate-500">Số tài khoản</span>
                                <div className="flex items-center gap-2">
                                     <span className="font-bold text-red-500 font-mono text-lg">cs6</span>
                                </div>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500">Nội dung</span>
                                <span className="font-bold font-mono text-yellow-400">{user.paymentCode}</span>
                             </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900 text-center border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-4">
                            Vui lòng quét mã để kích hoạt tài khoản.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={onUpdate} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                                <RefreshCw size={16}/> Đã CK / Làm mới
                             </button>
                             <button onClick={onLogout} className="bg-red-900/20 hover:bg-red-900/40 text-red-400 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border border-red-900/30">
                                <LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
             <div className="absolute top-4 right-4 flex items-center gap-4">
                <span className="text-slate-400">Xin chào, {user.email}</span>
                <button onClick={onLogout} className="bg-slate-800 p-2 rounded hover:bg-slate-700 text-white"><LogOut size={16}/></button>
             </div>

             <div className="text-center mb-12 mt-10">
                <h2 className="text-4xl font-bold text-white mb-4">Chọn Gói Dịch Vụ</h2>
                <p className="text-slate-400 max-w-xl mx-auto">Mở khóa toàn bộ tính năng PBN Hunter Pro. Tìm kiếm không giới hạn, phân tích AI và xuất báo cáo chi tiết.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                {(Object.keys(PLANS) as PlanType[]).map((key) => {
                    const plan = PLANS[key];
                    const isSelected = selectedPlan === key;
                    const isBestValue = key === '1_year';

                    return (
                        <div 
                            key={key} 
                            onClick={() => setSelectedPlan(key)}
                            className={`relative bg-slate-900 rounded-2xl p-6 border-2 transition-all cursor-pointer hover:transform hover:-translate-y-1 ${isSelected ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-slate-800 hover:border-slate-600'}`}
                        >
                            {isBestValue && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    TIẾT KIỆM NHẤT
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-6">
                                <span className="text-3xl font-bold text-blue-400">{plan.price.toLocaleString()}đ</span>
                                <span className="text-slate-500 text-sm mb-1">/ trọn gói</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-slate-300 text-sm"><Check size={16} className="text-green-500"/> Truy cập Full Tool</li>
                                <li className="flex items-center gap-2 text-slate-300 text-sm"><Check size={16} className="text-green-500"/> Scan không giới hạn</li>
                                <li className="flex items-center gap-2 text-slate-300 text-sm"><Check size={16} className="text-green-500"/> Xuất file CSV</li>
                                <li className="flex items-center gap-2 text-slate-300 text-sm"><Check size={16} className="text-green-500"/> Hỗ trợ 24/7</li>
                            </ul>
                            <div className={`w-full py-3 rounded-lg font-bold text-center transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                {isSelected ? 'Đã Chọn' : 'Chọn Gói Này'}
                            </div>
                        </div>
                    );
                })}
             </div>

             {selectedPlan && (
                <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-6 shadow-2xl animate-in slide-in-from-bottom">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="text-slate-400 text-sm">Bạn đã chọn gói:</p>
                            <h4 className="text-2xl font-bold text-white">{PLANS[selectedPlan].name} - {PLANS[selectedPlan].price.toLocaleString()}đ</h4>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="text-right hidden md:block">
                                <p className="text-xs text-slate-500">Mã thanh toán của bạn:</p>
                                <p className="text-yellow-400 font-mono font-bold text-lg">{user.paymentCode}</p>
                             </div>
                             <button 
                                onClick={handleSubscribe}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg flex items-center gap-2"
                            >
                                <CreditCard size={20} /> Xác nhận & Thanh toán
                             </button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

// --- ADMIN DASHBOARD ---
export const AdminDashboard: React.FC<{ onLogout: () => void; onGoToTool: () => void }> = ({ onLogout, onGoToTool }) => {
    const [users, setUsers] = useState<User[]>(getUsers());
    const [keys, setKeys] = useState<AccessKey[]>(getAccessKeys());
    const [refresh, setRefresh] = useState(0);
    const [selectedPlanForNewKey, setSelectedPlanForNewKey] = useState<PlanType>('1_month');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-refresh logic to see new signups
    useEffect(() => {
        const interval = setInterval(() => {
            setUsers(getUsers());
            setKeys(getAccessKeys());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setUsers(getUsers());
        setKeys(getAccessKeys());
    }, [refresh]);

    const handleApprove = (email: string) => {
        if(confirm(`Duyệt thanh toán cho ${email}?`)) {
            approveUser(email);
            setRefresh(r => r+1);
            alert(`Đã kích hoạt cho tài khoản: ${email}`);
        }
    };

    const handleRevoke = (email: string) => {
        if(confirm(`Hủy gói của ${email}?`)) {
            revokeUser(email);
            setRefresh(r => r+1);
        }
    };

    const handleCreateKey = () => {
        const newKey = createAccessKey(selectedPlanForNewKey);
        setRefresh(r => r+1);
        alert(`Đã tạo key mới: ${newKey.code}`);
    };

    const handleDeleteKey = (code: string) => {
        if(confirm(`Xóa key ${code}?`)) {
            deleteAccessKey(code);
            setRefresh(r => r+1);
        }
    };

    const copyKey = (code: string) => {
        navigator.clipboard.writeText(code);
        alert('Đã copy: ' + code);
    };

    const handleBackup = () => {
        const dataStr = JSON.stringify(users, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `pbn_hunter_users_backup_${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                const result = importUsers(content);
                alert(result.message);
                if (result.success) {
                    setRefresh(r => r+1);
                }
            }
        };
        reader.readAsText(fileObj);
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <header className="flex justify-between items-center mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="text-red-500"/> Admin Dashboard</h1>
                    <p className="text-slate-400 text-sm">Quản lý người dùng và thanh toán</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onGoToTool} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg border border-blue-500 transition-all font-bold text-sm">
                        <Globe size={16} /> Vào Tool
                    </button>
                    
                    <div className="h-8 w-px bg-slate-700 mx-2"></div>

                    <button onClick={handleBackup} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-2 text-sm" title="Sao lưu dữ liệu Users">
                        <Download size={16} /> Sao lưu
                    </button>

                    <button onClick={handleRestoreClick} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-2 text-sm" title="Khôi phục dữ liệu Users">
                        <Upload size={16} /> Khôi phục
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

                    <div className="h-8 w-px bg-slate-700 mx-2"></div>

                    <button onClick={() => setRefresh(r => r+1)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-700" title="Làm mới dữ liệu">
                        <RefreshCw size={20} />
                    </button>
                    <button onClick={onLogout} className="bg-red-900/80 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-red-700">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* USERS TABLE */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl mb-8">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Database size={16} className="text-slate-500"/> 
                        Danh sách User ({users.filter(u => u.role !== 'admin').length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-800">Email</th>
                                <th className="p-4 border-b border-slate-800">Mã Payment</th>
                                <th className="p-4 border-b border-slate-800">Gói Đăng Ký</th>
                                <th className="p-4 border-b border-slate-800">Trạng thái</th>
                                <th className="p-4 border-b border-slate-800">Hạn dùng</th>
                                <th className="p-4 border-b border-slate-800 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {users.filter(u => u.role !== 'admin').map((u) => (
                                <tr key={u.email} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-medium text-white">{u.email}</td>
                                    <td className="p-4 font-mono text-yellow-400 font-bold bg-yellow-400/10 inline-block m-2 rounded px-2">{u.paymentCode}</td>
                                    <td className="p-4">{u.plan ? PLANS[u.plan].name : <span className="text-slate-600">-</span>}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                            u.subscriptionStatus === 'active' ? 'bg-green-900/20 text-green-400 border-green-900' :
                                            u.subscriptionStatus === 'pending' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900 animate-pulse' :
                                            'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                            {u.subscriptionStatus === 'active' ? 'ĐÃ KÍCH HOẠT' : 
                                             u.subscriptionStatus === 'pending' ? 'CHỜ DUYỆT' : 'CHƯA ĐK'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{u.expiryDate ? new Date(u.expiryDate).toLocaleDateString('vi-VN') : '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.subscriptionStatus === 'pending' && (
                                                <button onClick={() => handleApprove(u.email)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-xs font-bold shadow-lg shadow-green-900/20 flex items-center gap-1">
                                                    <Check size={14} /> DUYỆT
                                                </button>
                                            )}
                                            {u.subscriptionStatus === 'active' && (
                                                <button onClick={() => handleRevoke(u.email)} className="bg-slate-800 hover:bg-red-900/80 text-slate-400 hover:text-white border border-slate-700 hover:border-red-700 px-3 py-1.5 rounded text-xs transition-all">
                                                    Khóa
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.filter(u => u.role !== 'admin').length === 0 && (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-500 italic">Chưa có người dùng nào đăng ký.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ACCESS KEY MANAGEMENT */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Key size={16} className="text-yellow-500"/> 
                        Quản lý Access Keys
                    </h3>
                    <div className="flex gap-2">
                        <select 
                            value={selectedPlanForNewKey}
                            onChange={(e) => setSelectedPlanForNewKey(e.target.value as PlanType)}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-1 outline-none"
                        >
                            {(Object.keys(PLANS) as PlanType[]).map(plan => (
                                <option key={plan} value={plan}>{PLANS[plan].name}</option>
                            ))}
                        </select>
                        <button onClick={handleCreateKey} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1">
                            <Plus size={14}/> Tạo Key
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-800">Mã Key</th>
                                <th className="p-4 border-b border-slate-800">Gói Dịch Vụ</th>
                                <th className="p-4 border-b border-slate-800">Trạng thái</th>
                                <th className="p-4 border-b border-slate-800">Ngày tạo</th>
                                <th className="p-4 border-b border-slate-800">Người dùng</th>
                                <th className="p-4 border-b border-slate-800 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {keys.map((k) => (
                                <tr key={k.code} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-yellow-400 font-bold">{k.code}</span>
                                            <button onClick={() => copyKey(k.code)} className="text-slate-500 hover:text-white" title="Copy">
                                                <Copy size={12}/>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">{PLANS[k.plan].name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                            k.isUsed ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-green-900/20 text-green-400 border-green-900'
                                        }`}>
                                            {k.isUsed ? 'ĐÃ DÙNG' : 'CHƯA DÙNG'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{new Date(k.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 text-xs text-slate-400">
                                        {k.usedBy || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        {!k.isUsed && (
                                            <button onClick={() => handleDeleteKey(k.code)} className="text-red-500 hover:text-red-400 p-2" title="Xóa Key">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {keys.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Chưa có Key nào được tạo.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
