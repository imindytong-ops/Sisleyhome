import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

const EXTRACT_TOOL = {
  name: "extract_document",
  description: "提取采购单据（发票/送货单/采购订单）中的结构化信息",
  input_schema: {
    type: "object" as const,
    properties: {
      documentNo: { type: ["string", "null"], description: "单据编号/发票号，找不到则为 null" },
      supplierName: { type: ["string", "null"], description: "供应商/开票方名称" },
      documentDate: {
        type: ["string", "null"],
        description: "单据日期，格式 YYYY-MM-DD，找不到则为 null",
      },
      items: {
        type: "array",
        description: "商品明细列表",
        items: {
          type: "object",
          properties: {
            productName: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
          },
          required: ["productName", "quantity", "unitPrice"],
        },
      },
      totalAmount: { type: ["number", "null"], description: "单据总金额，找不到则为 null" },
    },
    required: ["documentNo", "supplierName", "documentDate", "items", "totalAmount"],
  },
};

export async function recognizeDocument(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<OcrResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "extract_document" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "这是一张采购相关单据（可能是发票、送货单或采购订单）的照片/截图。请识别其中的供应商名称、单据编号、日期，以及商品明细（名称、数量、单价）。数字字段无法确定时使用 null，不要编造数据。",
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("OCR 识别未返回结构化结果");
  }

  return toolUse.input as OcrResult;
}
