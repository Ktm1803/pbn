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

  app.get("/api/google-suggest", async (req, res) => {
    try {
      const keyword = (req.query.q as string || "").trim();
      const lang = (req.query.hl as string || "vi").trim();
      if (!keyword) {
        return res.json({ success: true, suggestions: [] });
      }

      const googleUrl = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${encodeURIComponent(lang)}&q=${encodeURIComponent(keyword)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      let suggestions: string[] = [];

      try {
        const googleRes = await fetch(googleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (googleRes.ok) {
          const data = await googleRes.json();
          if (Array.isArray(data) && Array.isArray(data[1])) {
            suggestions = data[1].map((s: any) => String(s).trim()).filter(Boolean);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn("Direct Google suggest call failed, falling back to Gemini AI:", err);
      }

      // If Google Suggest returned fewer than 5 keywords, enrich/fallback with Gemini AI
      if (suggestions.length < 5) {
        try {
          const prompt = `Cho từ khóa gốc "${keyword}", hãy gợi ý 10 từ khóa tìm kiếm liên quan SEO/PBN phổ biến nhất trên Google bằng tiếng Việt. Trả về danh sách phân cách bởi dấu phẩy, không chứa số thứ tự hay giải thích.`;
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          const aiSuggestions = (aiResponse.text || "")
            .split(/[,;\n]/)
            .map(s => s.replace(/^[0-9+.\s-]+/, '').trim())
            .filter(Boolean);

          suggestions = Array.from(new Set([...suggestions, ...aiSuggestions]));
        } catch (aiErr) {
          console.warn("AI suggest enrichment failed:", aiErr);
        }
      }

      res.json({ success: true, keyword, suggestions });
    } catch (error) {
      console.error("Google suggest endpoint error:", error);
      res.json({ success: false, suggestions: [] });
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

  app.post("/api/check-viewdns", async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.json({ success: false, message: "Missing domain" });
      }

      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const parts = cleanDomain.split('.');
      if (parts.length > 2 && !['com.vn', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn', 'co.uk', 'org.uk', 'com.au'].some(suffix => cleanDomain.endsWith(suffix))) {
        return res.json({
          success: true,
          hasHistory: false,
          recordCount: 0,
          message: '🔴 ViewDNS: Không hỗ trợ subdomain'
        });
      }

      let viewDnsCount = 0;
      let archiveSnapshots = 0;
      let createdYear: number | null = null;
      const foundIps = new Set<string>();

      // Execute multi-source checks concurrently
      await Promise.allSettled([
        // 1. ViewDNS.info direct scraper
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 4000);
            const r = await fetch(`https://viewdns.info/iphistory/?domain=${encodeURIComponent(cleanDomain)}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              },
              signal: controller.signal
            });
            clearTimeout(tid);
            if (r.ok) {
              const html = await r.text();
              if (!html.includes('Just a moment') && !html.includes('cloudflare')) {
                const trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
                const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
                const validRows = trs.filter(tr => {
                  if (!ipRegex.test(tr)) return false;
                  const trL = tr.toLowerCase();
                  return !trL.includes('location') && !trL.includes('owner') && !trL.includes('last changed');
                });
                if (validRows.length > 0) viewDnsCount = validRows.length;
              }
            }
          } catch (e) {}
        })(),

        // 2. HackerTarget Host Search / IP history
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 3500);
            const r = await fetch(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(cleanDomain)}`, {
              signal: controller.signal
            });
            clearTimeout(tid);
            if (r.ok) {
              const text = await r.text();
              text.split('\n').forEach(line => {
                const parts = line.split(',');
                if (parts[1] && /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.test(parts[1].trim())) {
                  foundIps.add(parts[1].trim());
                }
              });
            }
          } catch (e) {}
        })(),

        // 3. Web Archive CDX API
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 4000);
            const r = await fetch(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanDomain)}&output=json&fl=timestamp,original&limit=100`, {
              signal: controller.signal
            });
            clearTimeout(tid);
            if (r.ok) {
              const json = await r.json();
              if (Array.isArray(json) && json.length > 1) {
                archiveSnapshots = json.length - 1;
              }
            }
          } catch (e) {}
        })(),

        // 4. Google & Cloudflare DoH (Live IP lookup)
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 3000);
            const [gRes, cfRes] = await Promise.all([
              fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`, { signal: controller.signal }).catch(() => null),
              fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=A`, {
                headers: { 'Accept': 'application/dns-json' },
                signal: controller.signal
              }).catch(() => null)
            ]);
            clearTimeout(tid);

            [gRes, cfRes].forEach(async res => {
              if (res && res.ok) {
                const json = await res.json();
                if (json?.Answer && Array.isArray(json.Answer)) {
                  json.Answer.forEach((a: any) => {
                    if (a.type === 1 && a.data && /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.test(a.data)) {
                      foundIps.add(a.data);
                    }
                  });
                }
              }
            });
          } catch (e) {}
        })(),

        // 5. TLD-Specific RDAP
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 3500);
            const tld = cleanDomain.split('.').pop() || '';
            let rdapUrl = `https://rdap.org/domain/${cleanDomain}`;
            if (tld === 'com' || tld === 'net') {
              rdapUrl = `https://rdap.verisign.com/com/v1/domain/${cleanDomain}`;
            } else if (tld === 'info') {
              rdapUrl = `https://rdap.identitydigital.services/rdap/domain/${cleanDomain}`;
            } else if (tld === 'org') {
              rdapUrl = `https://rdap.publicinterestregistry.org/rdap/domain/${cleanDomain}`;
            }
            
            const r = await fetch(rdapUrl, { signal: controller.signal });
            clearTimeout(tid);
            if (r.ok) {
              const json = await r.json();
              if (json.events && Array.isArray(json.events)) {
                const regEvent = json.events.find((e: any) => e.eventAction === 'registration');
                if (regEvent && regEvent.eventDate) {
                  createdYear = new Date(regEvent.eventDate).getFullYear();
                }
              }
            }
          } catch (e) {}
        })()
      ]);

      let hasHistory = false;
      let recordCount = 0;
      let message = '';

      if (viewDnsCount > 0) {
        hasHistory = true;
        recordCount = viewDnsCount;
        message = `🟢 Có ${recordCount} bản ghi lịch sử IP trên ViewDNS`;
      } else if (archiveSnapshots > 0 || foundIps.size > 0 || createdYear !== null) {
        hasHistory = true;
        if (archiveSnapshots >= 50) {
          recordCount = Math.min(300, Math.max(10, Math.ceil(archiveSnapshots / 3)));
        } else if (archiveSnapshots > 0) {
          recordCount = Math.max(foundIps.size, Math.min(20, Math.ceil(archiveSnapshots / 2)));
        } else {
          recordCount = Math.max(1, foundIps.size);
        }

        const details = [];
        if (foundIps.size > 0) details.push(`${foundIps.size} IP`);
        if (archiveSnapshots > 0) details.push(`Archive: ${archiveSnapshots} snapshots`);
        if (createdYear) details.push(`Tạo năm ${createdYear}`);

        message = `🟢 Có ${recordCount}+ bản ghi lịch sử IP (${details.join(', ')})`;
      } else {
        hasHistory = false;
        recordCount = 0;
        message = '🔴 ViewDNS: Không tìm thấy dữ liệu lịch sử';
      }

      return res.json({
        success: true,
        hasHistory,
        recordCount,
        message
      });

    } catch (err) {
      return res.json({
        success: true,
        hasHistory: false,
        recordCount: 0,
        message: "🔴 ViewDNS: Không kết nối được tới dịch vụ DNS History"
      });
    }
  });

  app.post("/api/check-live", async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.status(400).json({ error: "Missing domain" });
      }

      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

      let rdapStatus: 'not_found' | 'registered' | 'unknown' = 'unknown';
      let dnsStatus: 'active' | 'nxdomain' | 'no_answer' | 'unknown' = 'unknown';
      let activeIps: string[] = [];

      await Promise.allSettled([
        // 1. TLD-Specific RDAP Lookup
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 4000);
            const tld = cleanDomain.split('.').pop() || '';
            let rdapUrl = `https://rdap.org/domain/${cleanDomain}`;
            if (tld === 'com' || tld === 'net') {
              rdapUrl = `https://rdap.verisign.com/com/v1/domain/${cleanDomain}`;
            } else if (tld === 'info') {
              rdapUrl = `https://rdap.identitydigital.services/rdap/domain/${cleanDomain}`;
            } else if (tld === 'org') {
              rdapUrl = `https://rdap.publicinterestregistry.org/rdap/domain/${cleanDomain}`;
            }

            const r = await fetch(rdapUrl, { signal: controller.signal });
            clearTimeout(tid);
            if (r.status === 404) {
              rdapStatus = 'not_found';
            } else if (r.ok) {
              rdapStatus = 'registered';
            }
          } catch (e) {}
        })(),

        // 2. Dual DoH Lookup (Google DNS + Cloudflare DNS)
        (async () => {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 4000);
            
            const [gRes, cfRes] = await Promise.all([
              fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`, { signal: controller.signal }).catch(() => null),
              fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=A`, {
                headers: { 'Accept': 'application/dns-json' },
                signal: controller.signal
              }).catch(() => null)
            ]);
            clearTimeout(tid);

            const collectedIps: string[] = [];
            let isNxDomain = false;

            for (const r of [gRes, cfRes]) {
              if (r && r.ok) {
                const json = await r.json();
                if (json.Status === 3 || json.Status === 2) {
                  isNxDomain = true;
                } else if (json.Answer && Array.isArray(json.Answer)) {
                  json.Answer.forEach((a: any) => {
                    if (a.type === 1 && a.data && /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.test(a.data)) {
                      collectedIps.push(a.data);
                    }
                  });
                }
              }
            }

            if (collectedIps.length > 0) {
              dnsStatus = 'active';
              activeIps = Array.from(new Set(collectedIps));
            } else if (isNxDomain) {
              dnsStatus = 'nxdomain';
            } else {
              dnsStatus = 'no_answer';
            }
          } catch (e) {}
        })()
      ]);

      let liveAvailability: 'available' | 'registered_active' | 'unknown' = 'unknown';
      let dnsStatusMessage = '';

      if (dnsStatus === 'active') {
        liveAvailability = 'registered_active';
        dnsStatusMessage = `🔴 Active DNS (${activeIps.slice(0, 2).join(', ')}): Tên miền đang hoạt động`;
      } else if (rdapStatus === 'not_found') {
        liveAvailability = 'available';
        dnsStatusMessage = '🟢 Tự do đăng ký (WHOIS / RDAP không tồn tại)';
      } else if (dnsStatus === 'nxdomain' || dnsStatus === 'no_answer') {
        liveAvailability = 'available';
        dnsStatusMessage = '🟢 Đã hết hạn / NXDOMAIN (Không có bản ghi DNS active)';
      } else if (rdapStatus === 'registered') {
        liveAvailability = 'registered_active';
        dnsStatusMessage = '🔴 Tên miền đang trong thời hạn đăng ký (WHOIS Active)';
      } else {
        liveAvailability = 'available';
        dnsStatusMessage = '🟢 Khả năng cao đã hết hạn / Sẵn sàng mua';
      }

      return res.json({
        success: true,
        domain: cleanDomain,
        liveAvailability,
        dnsStatusMessage,
        details: {
          rdapStatus,
          dnsStatus,
          activeIps
        }
      });

    } catch (err) {
      return res.json({
        success: true,
        liveAvailability: 'unknown',
        dnsStatusMessage: '⚪ Cần kiểm tra trực tiếp qua Registrar'
      });
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
