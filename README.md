
# PBN Hunter Pro - Domain Analyzer

Công cụ phân tích và lọc tên miền hết hạn (Expired Domains) chuyên sâu với quy trình lọc đa tầng: Archive.org, Ahrefs, Majestic và Google Penalty.

## 🚀 Tính Năng Chính
- **Quét Đa Nguồn:** Tự động lọc các domain có lịch sử trên Archive.org và còn khả dụng (chưa bị mua).
- **Lọc Chỉ Số SEO:** Lọc DR, UR, RD, TF, CF theo yêu cầu.
- **Check Penalty:** Kiểm tra tình trạng Index và Google Safe Browsing.
- **AI Audit:** Sử dụng Gemini AI để đánh giá tiềm năng SEO của lô domain.
- **Hệ Thống Key:** Quản lý truy cập bằng Key kích hoạt hoặc Đồng bộ thiết bị.

## 🛠 Cài Đặt & Triển Khai

### 1. Triển khai lên Vercel
- Đẩy mã nguồn lên GitHub.
- Kết nối Vercel với Repository.
- Thêm **Environment Variable**: `API_KEY` = [Khóa Gemini của bạn].
- Nhấn **Deploy**.

### 2. Chạy Local
```bash
npm install
npm run dev
```

## 📋 Quy Trình Hoạt Động Chi Tiết
1. **Thu Domain:** Hệ thống quét các nguồn tên miền hết hạn. Chỉ những domain có dữ liệu trên Wayback Machine (Archive.org) và đang ở trạng thái tự do (Available) mới được đưa vào danh sách.
2. **Lọc Chỉ Số:** Người dùng tùy chỉnh bộ lọc (DR > 10, TF > 10, v.v.).
3. **Check Penalty:** Hệ thống giả lập kiểm tra các yếu tố rủi ro của Google.
4. **Kết quả:** Xuất danh sách sạch ra CSV hoặc nhờ AI phân tích chiến lược sử dụng.

---
*Phát triển bởi Đỗ Ngọc Thành.*
