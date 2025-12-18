
# PBN Hunter Pro - Domain Analyzer

**PBN Hunter Pro** là một công cụ phân tích và lọc tên miền hết hạn (Expired Domains) chuyên sâu dành cho các chuyên gia SEO. Công cụ giúp tối ưu hóa quy trình xây dựng hệ thống vệ tinh (PBN) hoặc tìm kiếm tên miền cũ chất lượng cao.

## 🚀 Tính Năng Chính
- **Thu thập Domain (Crawl):** Tích hợp giả lập quét Archive.org để tìm domain có lịch sử.
- **Lọc Chỉ Số (Filter):** Lọc theo DR, UR, RD (Ahrefs) và TF, CF (Majestic).
- **Kiểm Tra Penalty:** Tự động check Google Index và Safe Browsing.
- **Phân Tích AI (Gemini):** Sử dụng trí tuệ nhân tạo để đánh giá chất lượng lô domain.
- **Quản Lý Người Dùng:** Hệ thống đăng ký, đăng nhập và Access Key dành cho Admin.

## 🛠 Cài Đặt Local

1.  **Clone dự án:**
    ```bash
    git clone [URL_REPO]
    cd pbn-hunter-pro
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Cấu hình API Key:**
    Tạo tệp `.env` tại thư mục gốc và thêm key Gemini của bạn:
    ```env
    VITE_API_KEY=your_google_gemini_api_key_here
    ```

4.  **Chạy dự án:**
    ```bash
    npm run dev
    ```

## 📋 Quy Trình Hoạt Động
1.  **Bước 1:** Nhập từ khóa để quét các domain có lịch sử trên Archive.org.
2.  **Bước 2:** Thiết lập các thông số SEO mong muốn (DR, TF, Giá).
3.  **Bước 3:** Hệ thống kiểm tra tình trạng index và án phạt của Google.
4.  **Bước 4:** Xem danh sách kết quả, yêu cầu AI phân tích và xuất file CSV.

## ⚖️ Giấy Phép
Dự án được phát triển nhằm mục đích nghiên cứu và hỗ trợ cộng đồng SEO.

---
*Phát triển bởi Đỗ Ngọc Thành.*
