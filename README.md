# PBN Hunter Pro - Domain Analyzer

Công cụ phân tích và lọc tên miền hết hạn (Expired Domains) chuyên sâu với quy trình lọc đa tầng: Archive.org, Ahrefs, Majestic và Google Penalty.

## 🚀 Tính Năng Chính
- **Quét Đa Nguồn:** Tự động lọc các domain có lịch sử trên Archive.org và còn khả dụng (chưa bị mua).
- **Lọc Chỉ Số SEO:** Lọc DR, UR, RD, TF, CF theo yêu cầu.
- **Check Penalty:** Kiểm tra tình trạng Index và Google Safe Browsing.
- **AI Audit:** Sử dụng Gemini AI để đánh giá tiềm năng SEO của lô domain.
- **Hệ Thống Key:** Quản lý truy cập bằng Key kích hoạt hoặc Đồng bộ thiết bị.

## 🛠 Triển Khai Nhanh (Đã có API Key)

Dự án đã được cấu hình sẵn API Key trong file `.env`. Bạn chỉ cần thực hiện các bước sau:

### 1. Triển khai lên Vercel
- Đẩy mã nguồn này lên GitHub của bạn.
- Vào Vercel, chọn **New Project** và kết nối với Repository.
- Vercel sẽ tự động nhận diện cấu hình Vite và triển khai.
- *(Lưu ý: Nếu không chạy, hãy kiểm tra phần Environment Variables trên Vercel và thêm API_KEY thủ công).*

### 2. Chạy Local
```bash
npm install
npm run dev
```

## 📋 Quy Trình Hoạt Động Chi Tiết
1. **Thu Domain:** Hệ thống quét các nguồn tên miền hết hạn. Chỉ những domain có dữ liệu trên Wayback Machine (Archive.org) mới được đưa vào danh sách.
2. **Lọc Chỉ Số:** Người dùng tùy chỉnh bộ lọc (DR > 10, TF > 10, v.v.).
3. **Check Penalty:** Hệ thống giả lập kiểm tra các yếu tố rủi ro của Google.
4. **Kết quả:** Xuất danh sách sạch ra CSV hoặc nhờ AI phân tích chiến lược sử dụng.

---
*Phát triển bởi Đỗ Ngọc Thành.*