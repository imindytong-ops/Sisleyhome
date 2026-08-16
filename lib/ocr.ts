const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const ZHIPU_MODEL = "glm-4.6v";

export type OcrItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type OcrResult = {
  documentNo: string | null;
  supplierName: string | null;
  documentDate: string | null;
  items: OcrItem[];
  totalAmount: number | null;
};

const PROMPT = `这是一张采购相关单据（可能是发票、送货单或采购订单）的照片/截图。请识别其中的信息，只输出一个 JSON 对象，不要输出任何其他文字或 markdown 代码块标记，JSON 结构如下：
{
  "documentNo": string | null,   // 单据编号/发票号，找不到则为 null
  "supplierName": string | null, // 供应商/开票方名称
  "documentDate": string | null, // 单据日期，格式 YYYY-MM-DD，找不到则为 null
  "items": [
    { "productName": string, "quantity": number, "unitPrice": number }
  ],
  "totalAmount": number | null   // 单据总金额，找不到则为 null
}
数字字段无法确定时使用 null，不要编造数据。`;

function parseJsonFromModelOutput(text: string): OcrResult {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function recognizeDocument(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<OcrResult> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error("ZHIPU_API_KEY 未配置");
  }

  const res = await fetch(ZHIPU_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ZHIPU_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${imageBase64}` },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`智谱 API 调用失败 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OCR 识别未返回有效结果");
  }

  return parseJsonFromModelOutput(content);
}
