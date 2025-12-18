
import { User, PlanType, PLANS, AccessKey } from "../types";

const USERS_KEY = 'pbn_hunter_users';
const KEYS_KEY = 'pbn_hunter_access_keys';
const CURRENT_USER_KEY = 'pbn_hunter_current_user';

// Initialize System Accounts (Admins & Default Users)
const initSystemAccounts = () => {
    const users = getUsers();
    
    const defaultAccounts: User[] = [
        // Original Admin
        {
            email: "thanhfa2k2@gmail.com",
            password: "Ngocthanh@1",
            role: 'admin',
            subscriptionStatus: 'active',
            paymentCode: 'ADMIN',
            createdAt: Date.now(),
            expiryDate: 9999999999999
        },
        // Requested Admin
        {
            email: "dev@cdk.com",
            password: "Ngocthanh@1",
            role: 'admin',
            subscriptionStatus: 'active',
            paymentCode: 'ADMIN-DEV',
            createdAt: Date.now(),
            expiryDate: 9999999999999
        },
        // Requested Permanent User
        {
            email: "cdk@cdk.com",
            password: "admin123",
            role: 'user',
            subscriptionStatus: 'active',
            plan: '1_year', // Set a plan so UI displays correctly
            paymentCode: 'VIP-USER',
            createdAt: Date.now(),
            expiryDate: 9999999999999
        }
    ];

    let hasChanges = false;
    defaultAccounts.forEach(account => {
        // Check case-insensitive to avoid duplicates
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
    // Generate a random key format: KEY-XXXX-XXXX
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
    initSystemAccounts();
    const keys = getAccessKeys();
    const keyIndex = keys.findIndex(k => k.code === code && !k.isUsed);

    if (keyIndex === -1) {
        return { success: false, message: "Key không tồn tại hoặc đã được sử dụng." };
    }

    const key = keys[keyIndex];
    const planDetails = PLANS[key.plan];
    
    // Generate a unique user for this key
    // We use the key code in the email to ensure uniqueness: user_KEY-XXXX@key.login
    const userEmail = `user_${key.code.toLowerCase()}@pbn.pro`;
    const users = getUsers();
    
    // Check if user somehow exists (shouldn't happen if key is unused, but safety first)
    if (users.find(u => u.email === userEmail)) {
        return { success: false, message: "Lỗi hệ thống: User key đã tồn tại." };
    }

    const newUser: User = {
        email: userEmail,
        password: "key_login_no_pass", // Dummy password
        role: 'user',
        subscriptionStatus: 'active',
        plan: key.plan,
        paymentCode: key.code,
        createdAt: Date.now(),
        expiryDate: Date.now() + (planDetails.durationDays * 24 * 60 * 60 * 1000)
    };

    // 1. Save new user
    users.push(newUser);
    saveUsers(users);

    // 2. Mark key as used
    keys[keyIndex].isUsed = true;
    keys[keyIndex].usedBy = userEmail;
    keys[keyIndex].usedAt = Date.now();
    saveAccessKeys(keys);

    // 3. Login
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return { success: true, user: newUser, message: "Kích hoạt Key thành công!" };
};

// --- EXISTING FUNCTIONS ---

export const importUsers = (jsonString: string): { success: boolean, message: string } => {
    try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed) && parsed.every(u => u.email && u.role)) {
            // Valid backup, save to local storage
            saveUsers(parsed);
            // Re-init system accounts just in case backup didn't have them
            initSystemAccounts();
            return { success: true, message: "Khôi phục dữ liệu thành công!" };
        }
        return { success: false, message: "File backup không hợp lệ." };
    } catch (e) {
        return { success: false, message: "Lỗi định dạng JSON." };
    }
};

export const login = (email: string, password: string): User | null => {
    initSystemAccounts();
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
    initSystemAccounts();
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
        return { success: false, message: "Email đã tồn tại." };
    }

    // Generate unique payment code: PBN + last 4 digits of timestamp + random
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
    const sessionUser = JSON.parse(stored);
    
    // Refresh user data from DB to get latest status
    const users = getUsers();
    const freshUser = users.find(u => u.email === sessionUser.email);
    return freshUser || null;
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

// Admin functions
export const approveUser = (email: string) => {
    const users = getUsers();
    const updatedUsers = users.map(u => {
        // Case-insensitive check
        if (u.email.toLowerCase() === email.toLowerCase()) {
            // Ensure a plan is set, default to 1_month if missing (fallback)
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

// Sync Features
export const generateSyncCode = (email: string): string => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return "";
    // Simple Base64 encoding of the user object for transfer
    return btoa(JSON.stringify(user));
};

export const loginWithSyncCode = (code: string): { success: boolean, user?: User, message: string } => {
    try {
        const decoded = atob(code);
        const user: User = JSON.parse(decoded);
        
        if (!user.email || !user.role) {
             return { success: false, message: "Mã đồng bộ không hợp lệ." };
        }

        const users = getUsers();
        const existingIndex = users.findIndex(u => u.email === user.email);
        
        if (existingIndex >= 0) {
            // Update existing user with synced data (e.g. they might have renewed on another device)
            users[existingIndex] = user;
        } else {
            // Add new user
            users.push(user);
        }
        
        saveUsers(users);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { success: true, user, message: "Đồng bộ tài khoản thành công!" };

    } catch (e) {
        return { success: false, message: "Mã không đúng định dạng." };
    }
};
