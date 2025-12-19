
import { User, PlanType, PLANS, AccessKey, BugReport } from "../types";

const USERS_KEY = 'pbn_hunter_users';
const KEYS_KEY = 'pbn_hunter_access_keys';
const CURRENT_USER_KEY = 'pbn_hunter_current_user';
const BUGS_KEY = 'pbn_hunter_bug_reports';

// Initialize System Accounts
const initSystemAccounts = () => {
    const stored = localStorage.getItem(USERS_KEY);
    const users: User[] = stored ? JSON.parse(stored) : [];
    
    const defaultAccounts: User[] = [
        {
            email: "thanhfa2k2@gmail.com",
            password: "Ngocthanh@1",
            role: 'admin',
            subscriptionStatus: 'active',
            paymentCode: 'ADMIN',
            createdAt: Date.now(),
            expiryDate: 9999999999999
        },
        {
            email: "dev@cdk.com",
            password: "Ngocthanh@1",
            role: 'admin',
            subscriptionStatus: 'active',
            paymentCode: 'ADMIN-DEV',
            createdAt: Date.now(),
            expiryDate: 9999999999999
        },
        {
            email: "cdk@cdk.com",
            password: "admin123",
            role: 'user',
            subscriptionStatus: 'active',
            plan: '1_year',
            paymentCode: 'VIP-USER',
            createdAt: Date.now(),
            expiryDate: 9999999999999
        }
    ];

    let hasChanges = false;
    defaultAccounts.forEach(account => {
        if (!users.find(u => u.email.toLowerCase() === account.email.toLowerCase())) {
            users.push(account);
            hasChanges = true;
        }
    });

    if (hasChanges) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

export const getUsers = (): User[] => {
    initSystemAccounts();
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// --- ACCESS KEY MANAGEMENT ---

export const getAccessKeys = (): AccessKey[] => {
    const stored = localStorage.getItem(KEYS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveAccessKeys = (keys: AccessKey[]) => {
    localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
};

export const createAccessKey = (plan: PlanType): AccessKey => {
    const keys = getAccessKeys();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `KEY-${randomStr}`;
    
    const newKey: AccessKey = {
        code,
        plan,
        isUsed: false,
        createdAt: Date.now()
    };
    
    keys.push(newKey);
    saveAccessKeys(keys);
    return newKey;
};

export const deleteAccessKey = (code: string) => {
    let keys = getAccessKeys();
    keys = keys.filter(k => k.code !== code);
    saveAccessKeys(keys);
};

export const loginWithAccessKey = (code: string): { success: boolean, user?: User, message: string } => {
    const keys = getAccessKeys();
    const keyIndex = keys.findIndex(k => k.code === code && !k.isUsed);

    if (keyIndex === -1) {
        return { success: false, message: "Key không tồn tại hoặc đã được sử dụng." };
    }

    const key = keys[keyIndex];
    const planDetails = PLANS[key.plan];
    
    const userEmail = `user_${key.code.toLowerCase()}@pbn.pro`;
    const users = getUsers();
    
    if (users.find(u => u.email === userEmail)) {
        return { success: false, message: "Lỗi hệ thống: User key đã tồn tại." };
    }

    const newUser: User = {
        email: userEmail,
        password: "key_login_no_pass",
        role: 'user',
        subscriptionStatus: 'active',
        plan: key.plan,
        paymentCode: key.code,
        createdAt: Date.now(),
        expiryDate: Date.now() + (planDetails.durationDays * 24 * 60 * 60 * 1000)
    };

    users.push(newUser);
    saveUsers(users);

    keys[keyIndex].isUsed = true;
    keys[keyIndex].usedBy = userEmail;
    keys[keyIndex].usedAt = Date.now();
    saveAccessKeys(keys);

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return { success: true, user: newUser, message: "Kích hoạt Key thành công!" };
};

// --- BUG REPORTS ---
export const getBugReports = (): BugReport[] => {
    const stored = localStorage.getItem(BUGS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const submitBugReport = (email: string, content: string) => {
    const reports = getBugReports();
    const newReport: BugReport = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        content,
        createdAt: Date.now(),
        status: 'new'
    };
    reports.push(newReport);
    localStorage.setItem(BUGS_KEY, JSON.stringify(reports));
};

export const resolveBugReport = (id: string) => {
    const reports = getBugReports();
    const updated = reports.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r);
    localStorage.setItem(BUGS_KEY, JSON.stringify(updated));
};

export const deleteBugReport = (id: string) => {
    const reports = getBugReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(BUGS_KEY, JSON.stringify(filtered));
};

// --- AUTH CORE ---

export const login = (email: string, password: string): User | null => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    }
    return null;
};

export const register = (email: string, password: string): { success: boolean, message: string } => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
        return { success: false, message: "Email đã tồn tại." };
    }

    const paymentCode = `PBN-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const newUser: User = {
        email: normalizedEmail,
        password,
        role: 'user',
        subscriptionStatus: 'inactive',
        paymentCode,
        createdAt: Date.now()
    };

    users.push(newUser);
    saveUsers(users);
    return { success: true, message: "Đăng ký thành công." };
};

export const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;
    
    let sessionUser: User;
    try {
        sessionUser = JSON.parse(stored);
    } catch (e) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
    }
    
    const users = getUsers();
    const freshUser = users.find(u => u.email === sessionUser.email);
    
    if (!freshUser) return null;

    if (freshUser.expiryDate && Date.now() > freshUser.expiryDate && freshUser.subscriptionStatus === 'active') {
        const updatedUser = { ...freshUser, subscriptionStatus: 'inactive' as const };
        const updatedUsers = users.map(u => u.email === updatedUser.email ? updatedUser : u);
        saveUsers(updatedUsers);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    }

    return freshUser;
};

export const approveUser = (email: string) => {
    const users = getUsers();
    const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === email.toLowerCase()) {
            const planKey = u.plan || '1_month';
            const days = PLANS[planKey].durationDays;
            const expiryDate = Date.now() + (days * 24 * 60 * 60 * 1000);
            
            return { 
                ...u, 
                subscriptionStatus: 'active' as const, 
                plan: planKey,
                expiryDate 
            };
        }
        return u;
    });
    saveUsers(updatedUsers);
};

export const revokeUser = (email: string) => {
    const users = getUsers();
    const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === email.toLowerCase()) {
            return { ...u, subscriptionStatus: 'inactive' as const, expiryDate: undefined, plan: undefined };
        }
        return u;
    });
    saveUsers(updatedUsers);
}

export const generateSyncCode = (email: string): string => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return "";
    return btoa(JSON.stringify(user));
};

export const loginWithSyncCode = (code: string): { success: boolean, user?: User, message: string } => {
    try {
        const decoded = atob(code);
        const user: User = JSON.parse(decoded);
        const users = getUsers();
        const existingIndex = users.findIndex(u => u.email === user.email);
        if (existingIndex >= 0) users[existingIndex] = user;
        else users.push(user);
        saveUsers(users);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { success: true, user, message: "Đồng bộ tài khoản thành công!" };
    } catch (e) {
        return { success: false, message: "Mã không đúng định dạng." };
    }
};

export const importUsers = (jsonString: string): { success: boolean, message: string } => {
    try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) {
            saveUsers(parsed);
            return { success: true, message: "Khôi phục dữ liệu thành công!" };
        }
        return { success: false, message: "File backup không hợp lệ." };
    } catch (e) {
        return { success: false, message: "Lỗi định dạng JSON." };
    }
};

export const requestSubscription = (email: string, plan: PlanType) => {
    const users = getUsers();
    const updatedUsers = users.map(u => {
        if (u.email === email) {
            return { ...u, plan, subscriptionStatus: 'pending' as const };
        }
        return u;
    });
    saveUsers(updatedUsers);
};
