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

const optionalNumberSchema = z.union([z.number(), z.literal(""), z.nan()]);

const isEnteredNumber = (val: number | ""): val is number =>
  val !== "" && !Number.isNaN(val);

/** 明細行の Zod スキーマ */
export const detailItemSchema = z
  .object({
    productName: z
      .string()
      .min(1, "商品名は必須です")
      .max(100, "商品名は100文字以内で入力してください"),
    modelNumber: z
      .string()
      .max(75, "商品型番号は75文字以内で入力してください"),
    unitPrice: optionalNumberSchema,
    quantity: optionalNumberSchema.refine(
      (val) => !isEnteredNumber(val) || val !== 0,
      {
        message: "数量は0以外を入力してください",
      }
    ),
    taxRate: z.union([z.literal(0), z.literal(8), z.literal(10), z.literal("")]),
    amount: optionalNumberSchema
      .refine((val) => isEnteredNumber(val), {
        message: "金額は必須です",
      })
      .refine((val) => !isEnteredNumber(val) || Number.isInteger(val), {
        message: "金額は整数で入力してください",
      }),
  })
  .superRefine((detail, ctx) => {
    if (
      !isEnteredNumber(detail.unitPrice) ||
      !isEnteredNumber(detail.quantity) ||
      !isEnteredNumber(detail.amount) ||
      detail.quantity === 0 ||
      !Number.isInteger(detail.amount)
    ) {
      return;
    }

    const expectedAmount = detail.unitPrice * detail.quantity;
    const diff = Math.abs(detail.amount - expectedAmount);
    const tolerance = Number.isInteger(detail.unitPrice) ? 0 : 1;

    if (diff > tolerance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "金額が単価×数量と一致しません",
        path: ["amount"],
      });
    }
  });

/** ページレベルのフォームデータ（認可依頼ペイロード） */
export interface PageFormData {
  orderName: string;
  savedDetails: SavedQuotationDetail[];
}
