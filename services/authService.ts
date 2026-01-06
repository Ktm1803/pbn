
import { User, PlanType, PLANS, AccessKey, BugReport } from "../types";
import { GoogleGenAI } from "@google/genai";

const USERS_KEY = 'pbn_hunter_users';
const KEYS_KEY = 'pbn_hunter_access_keys';
const CURRENT_USER_KEY = 'pbn_hunter_current_user';
const BUGS_KEY = 'pbn_hunter_bug_reports';

// Kênh đồng bộ hóa dữ liệu giữa các tab/cửa sổ (Cập nhật Admin Dashboard tức thì)
const authChannel = new BroadcastChannel('pbn_auth_sync');

// Khởi tạo AI để soạn thảo email
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * GIẢ LẬP GỬI EMAIL
 */
const simulateEmailSend = async (to: string, subject: string, body: string) => {
    console.log(`%c[HỆ THỐNG EMAIL] Gửi đến: ${to}`, "color: #10b981; font-weight: bold; border: 1px solid #10b981; padding: 2px 5px; border-radius: 4px;");
    console.log(`%cTiêu đề: ${subject}`, "color: #3b82f6; font-weight: bold;");
    console.log(`%cNội dung thông báo:`, "color: #94a3b8; font-style: italic;");
    console.log(body);
    console.log("-----------------------------------------");
    return new Promise((resolve) => setTimeout(resolve, 1500)); 
};

// Tạo nội dung email chuyên nghiệp bằng AI
const generateEmailBody = async (type: 'USER', data: any) => {
    const prompt = `Viết một email chào mừng ngắn gọn, chuyên nghiệp và nồng nhiệt gửi cho người dùng vừa tham gia PBN Hunter Pro. Email của họ là: ${data.email}. Nhắc họ liên hệ Admin nếu cần hỗ trợ kích hoạt gói qua Telegram @hima_dev.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || `Chào mừng ${data.email} đến với PBN Hunter Pro!`;
    } catch (e) {
        return `Chào mừng bạn đến với PBN Hunter Pro! Tài khoản: ${data.email}`;
    }
};

const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

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
    authChannel.postMessage({ type: 'UPDATE_USERS' });
};

authChannel.onmessage = (event) => {
    if (event.data.type === 'UPDATE_USERS') {
        window.dispatchEvent(new Event('storage_sync'));
    }
};

export const login = (email: string, password: string): { success: boolean, user?: User, message: string } => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
    
    if (user) {
        if (user.isLocked) {
            return { success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." };
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { success: true, user, message: "Đăng nhập thành công." };
    }
    return { success: false, message: "Email hoặc mật khẩu không đúng." };
};

/**
 * GIẢ LẬP ĐĂNG NHẬP GOOGLE
 */
export const loginWithGoogle = async (): Promise<{ success: boolean, user?: User, message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const googleEmail = `user_${Math.random().toString(36).slice(2, 7)}@gmail.com`;
    const users = getUsers();
    let user = users.find(u => u.email.toLowerCase() === googleEmail.toLowerCase());

    if (!user) {
        const paymentCode = `GGL-${Date.now().toString().slice(-4)}`;
        user = {
            email: googleEmail,
            password: 'social_login_no_password',
            role: 'user',
            subscriptionStatus: 'inactive',
            paymentCode,
            createdAt: Date.now()
        };
        users.push(user);
        saveUsers(users);

        // Chỉ gửi email chào mừng cho người dùng, không thông báo cho Admin
        try {
            const userEmailBody = await generateEmailBody('USER', { email: googleEmail });
            await simulateEmailSend(googleEmail, "Welcome to PBN Hunter Pro", userEmailBody);
        } catch (e) {
            console.error("Lỗi gửi email chào mừng:", e);
        }
    }

    if (user.isLocked) {
        return { success: false, message: "Tài khoản Google này đã bị khóa." };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user, message: "Đăng nhập Google thành công!" };
};

export const register = async (email: string, password: string): Promise<{ success: boolean, message: string }> => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();

    if (!validateEmail(normalizedEmail)) {
        return { success: false, message: "Vui lòng nhập địa chỉ Email chính xác." };
    }

    if (password.length < 6) {
        return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." };
    }

    if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
        return { success: false, message: "Email này đã được sử dụng." };
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

    try {
        const userEmailBody = await generateEmailBody('USER', { email: normalizedEmail });
        // Chỉ gửi chào mừng cho User, không gửi thông báo cho Admin theo yêu cầu
        await simulateEmailSend(normalizedEmail, "Welcome to PBN Hunter Pro", userEmailBody);
    } catch (e) {
        console.error("Lỗi gửi email chào mừng:", e);
    }

    return { success: true, message: "Đăng ký thành công! Vui lòng quay lại màn hình đăng nhập." };
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

    if (freshUser.isLocked) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
    }

    if (freshUser.expiryDate && Date.now() > freshUser.expiryDate && freshUser.subscriptionStatus === 'active') {
        const updatedUser = { ...freshUser, subscriptionStatus: 'inactive' as const };
        const updatedUsers = users.map(u => u.email === updatedUser.email ? updatedUser : u);
        saveUsers(updatedUsers);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    }

    return freshUser;
};

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
    const key = keys.find(k => k.code.trim().toUpperCase() === code.trim().toUpperCase());

    if (!key) {
        return { success: false, message: "Mã Key không tồn tại hoặc không hợp lệ." };
    }

    const users = getUsers();
    const userEmail = `user_${key.code.toLowerCase()}@pbn.pro`;
    let user = users.find(u => u.email === userEmail);

    if (!user) {
        const planDetails = PLANS[key.plan];
        user = {
            email: userEmail,
            password: "key_login_anywhere",
            role: 'user',
            subscriptionStatus: 'active',
            plan: key.plan,
            paymentCode: key.code,
            createdAt: key.usedAt || Date.now(),
            expiryDate: (key.usedAt || Date.now()) + (planDetails.durationDays * 24 * 60 * 60 * 1000)
        };
        users.push(user);
        saveUsers(users);
    }

    if (!key.isUsed) {
        const keyIndex = keys.findIndex(k => k.code === key.code);
        keys[keyIndex].isUsed = true;
        keys[keyIndex].usedBy = userEmail;
        keys[keyIndex].usedAt = Date.now();
        saveAccessKeys(keys);
    }

    if (user.isLocked) {
        return { success: false, message: "Tài khoản liên kết với Key này đã bị khóa." };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user, message: "Đăng nhập bằng Key thành công (Truy cập mọi nơi)!" };
};

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

export const toggleLockUser = (email: string) => {
    const users = getUsers();
    const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === email.toLowerCase()) {
            return { ...u, isLocked: !u.isLocked };
        }
        return u;
    });
    saveUsers(updatedUsers);
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
