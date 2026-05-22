import { z } from "zod";

/** 税区分 */
export type TaxType = "tax_exclusive" | "tax_inclusive";

/** 税率 */
export type TaxRate = 0 | 8 | 10;

/** 見積書 */
export interface Quotation {
  id: string;
  name: string;
}

/** 明細行 */
export interface DetailItem {
  productName: string;
  modelNumber: string;
  unitPrice: number | "";
  quantity: number | "";
  taxRate: TaxRate | "";
  amount: number | "";
}

/** 保存済み明細データ */
export interface SavedQuotationDetail {
  quotation: Quotation;
  taxType: TaxType;
  details: DetailItem[];
  subtotal: number;
}

/** 明細行の Zod スキーマ */
export const detailItemSchema = z.object({
  productName: z.string().min(1, "商品名は必須です"),
  modelNumber: z.string(),
  unitPrice: z.union([z.number(), z.literal(""), z.nan()]),
  quantity: z.union([z.number(), z.literal(""), z.nan()]),
  taxRate: z.union([z.literal(0), z.literal(8), z.literal(10), z.literal("")]),
  amount: z
    .union([z.number(), z.literal(""), z.nan()])
    .refine((val) => val !== "" && !Number.isNaN(val) && Number(val) > 0, {
      message: "金額は必須です",
    }),
});

/** ページレベルのフォームデータ（認可依頼ペイロード） */
export interface PageFormData {
  orderName: string;
  savedDetails: SavedQuotationDetail[];
}
