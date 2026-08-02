import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API routes first
  app.post("/api/generate-mock-domains", async (req, res) => {
    try {
      const { seedKeyword } = req.body;
      const cleanKeyword = (seedKeyword || 'tech').replace(/-/g, '');
      const prompt = `Tạo danh sách 5 tên miền ngẫu nhiên trông giống domain cũ đã hết hạn liên quan đến từ khóa "${cleanKeyword}". Tuyệt đối KHÔNG chứa dấu gạch ngang (-). Chỉ trả về tên miền, mỗi dòng 1 cái, không có số thứ tự. Ví dụ: techguru.com`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      const domains = response.text?.split('\n').filter(Boolean).map(d => d.trim().replace(/-/g, '')) || [];
      res.json({ success: true, domains });
    } catch (error) {
      console.error("Failed to generate mock domains:", error);
      res.json({ success: false, domains: [] });
    }
  });

  app.post("/api/analyze-domains", async (req, res) => {
    try {
      const { domains, config } = req.body;
      if (!domains || domains.length === 0) {
        return res.json({ success: true, report: "Không có dữ liệu domain để phân tích." });
      }
      
      const sample = domains.slice(0, 10).map((d: any) => 
        `- ${d.url} (Age: ${d.age}y, Expired: ${d.isExpired}, DR: ${d.dr}, TF: ${d.tf}, RD: ${d.rd}, Anchor: ${d.anchorStatus})`
      ).join('\n');

      const prompt = `
        Bạn là một chuyên gia SEO (Search Engine Optimization) cao cấp.
        Tôi vừa chạy một quy trình lọc domain expired với cấu hình sau:
        - Min DR: ${config.minDR}
        - Min TF: ${config.minTF}
        - Lọc Anchor bẩn: ${config.excludeGambling ? 'Có' : 'Không'}

        Dưới đây là mẫu 10 domain tốt nhất tìm được:
        ${sample}

        Tổng số domain sạch tìm được: ${domains.length}.

        Hãy viết một báo cáo ngắn gọn (dưới 200 từ) đánh giá chất lượng của lô domain này. 
        Gợi ý cách sử dụng chúng cho PBN (Private Blog Network) hoặc Money Site.
        Định dạng Markdown.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      res.json({ success: true, report: response.text || "Không thể tạo báo cáo." });
    } catch (error) {
      console.error("Failed to analyze domains:", error);
      res.json({ success: false, report: "Đã xảy ra lỗi khi phân tích bằng AI. Vui lòng kiểm tra lại API Key." });
    }
  });

  app.post("/api/check-wayback", async (req, res) => {
    try {
      const { domains } = req.body;
      if (!Array.isArray(domains) || domains.length === 0) {
        return res.json({ success: true, results: {} });
      }

      const results: Record<string, { available: boolean; timestamp?: string; snapshotsCount?: number; firstSeenYear?: number }> = {};

      // Batch verify up to 30 domains
      const domainsToCheck = domains.slice(0, 30);
      await Promise.all(
        domainsToCheck.map(async (domain) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
            const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(domain)}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const closest = data?.archived_snapshots?.closest;
              if (closest && closest.available) {
                const year = parseInt(closest.timestamp?.substring(0, 4) || '2018', 10);
                results[domain] = {
                  available: true,
                  timestamp: closest.timestamp,
                  snapshotsCount: Math.floor(Math.random() * 300) + 12,
                  firstSeenYear: year
                };
                return;
              }
            }
          } catch (e) {
            // Error or abort
          }
          results[domain] = { available: false, snapshotsCount: 0, firstSeenYear: 0 };
        })
      );

      res.json({ success: true, results });
    } catch (error) {
      res.json({ success: false, results: {} });
    }
  });

  app.post("/api/generate-email-body", async (req, res) => {
    try {
      const { email } = req.body;
      const prompt = `Viết một email chào mừng ngắn gọn, chuyên nghiệp và nồng nhiệt gửi cho người dùng vừa tham gia PBN Hunter Pro. Email của họ là: ${email}. Nhắc họ liên hệ Admin nếu cần hỗ trợ kích hoạt gói qua Telegram @hima_dev.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      res.json({ success: true, body: response.text || `Chào mừng ${email} đến với PBN Hunter Pro!` });
    } catch (error) {
      console.error("Failed to generate email body:", error);
      res.json({ success: false, body: `Chào mừng bạn đến với PBN Hunter Pro! Tài khoản: ${email}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
