import { GoogleGenAI } from "@google/genai";
import { DomainEntity, FilterConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDomainBatch = async (
  domains: DomainEntity[],
  config: FilterConfig
): Promise<string> => {
  if (!domains || domains.length === 0) return "Không có dữ liệu domain để phân tích.";

  const sample = domains.slice(0, 10).map(d => 
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

  try {
    // Fix: Using 'gemini-3-flash-preview' for basic text task as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Không thể tạo báo cáo.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Đã xảy ra lỗi khi phân tích bằng AI. Vui lòng kiểm tra lại API Key.";
  }
};

export const generateMockDomains = async (seedKeyword: string): Promise<string[]> => {
    // Helper to generate interesting looking domains for the simulation
    try {
         // Fix: Using 'gemini-3-flash-preview' for basic text task as per guidelines
         const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Tạo danh sách 5 tên miền ngẫu nhiên trông giống domain cũ đã hết hạn liên quan đến từ khóa "${seedKeyword || 'tech'}". Chỉ trả về tên miền, mỗi dòng 1 cái, không có số thứ tự. Ví dụ: techguru.com`,
          });
          return response.text?.split('\n').filter(Boolean) || [];
    } catch (e) {
        return [`${seedKeyword}news.com`, `old-${seedKeyword}.net`, `my-${seedKeyword}.org`];
    }
}