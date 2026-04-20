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

/** モーダルフォーム（現在表示中の明細のみ管理） */
export interface ModalFormData {
  taxType: TaxType;
  currentDetails: DetailItem[];
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
  taxRate: z.union([z.literal(0), z.literal(8), z.literal(10), z.literal(""), z.nan()]),
  amount: z
    .union([z.number(), z.literal(""), z.nan()])
    .refine((val) => val !== "" && !Number.isNaN(val) && Number(val) > 0, {
      message: "金額は必須です",
    }),
});

/**
 * 見積書1件分の明細配列のスキーマ。
 * Zod が配列を iterate し、issue.path = [detailIndex, fieldName] で失敗箇所を返す。
 * クロス行/クロスフィールドの検証が必要になれば superRefine をここに追加する。
 */
export const quotationDetailsSchema = z.array(detailItemSchema);

/** モーダルフォームの Zod スキーマ */
export const modalFormSchema = z
  .object({
    taxType: z.enum(["tax_exclusive", "tax_inclusive"]),
    currentDetails: z.array(detailItemSchema),
  })
  .superRefine((data, ctx) => {
    if (data.taxType === "tax_inclusive") {
      data.currentDetails.forEach((detail, index) => {
        if (detail.taxRate !== 8 && detail.taxRate !== 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "税率を選択してください",
            path: ["currentDetails", index, "taxRate"],
          });
        }
      });
    }
  });

/** ページレベルのフォームデータ（認可依頼ペイロード） */
export interface PageFormData {
  orderName: string;
  savedDetails: SavedQuotationDetail[];
}
