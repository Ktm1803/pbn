import { DomainEntity, FilterConfig } from "../types";

export const analyzeDomainBatch = async (
  domains: DomainEntity[],
  config: FilterConfig
): Promise<string> => {
  if (!domains || domains.length === 0) return "Không có dữ liệu domain để phân tích.";

  try {
    const response = await fetch("/api/analyze-domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains, config }),
    });
    const data = await response.json();
    return data.report || "Không thể tạo báo cáo.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Đã xảy ra lỗi khi phân tích bằng AI. Vui lòng kiểm tra lại API Key.";
  }
};

export const generateMockDomains = async (seedKeyword: string): Promise<string[]> => {
  try {
    const response = await fetch("/api/generate-mock-domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedKeyword }),
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.domains)) {
      return data.domains.map((d: string) => d.replace(/-/g, ''));
    }
    throw new Error("Invalid response");
  } catch (e) {
    const cleanKey = seedKeyword.replace(/-/g, '');
    return [`${cleanKey}news.com`, `old${cleanKey}.net`, `my${cleanKey}.org`];
  }
};

export const checkWaybackBatch = async (domains: string[]): Promise<Record<string, { available: boolean; timestamp?: string; snapshotsCount?: number; firstSeenYear?: number }>> => {
  try {
    const response = await fetch("/api/check-wayback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains }),
    });
    const data = await response.json();
    return data.results || {};
  } catch (e) {
    return {};
  }
};
