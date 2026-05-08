import { z } from "zod";

/** 税区分 */
export const taxTypeSchema = z.enum(["tax_exclusive", "tax_inclusive"]);
export type TaxType = z.infer<typeof taxTypeSchema>;

/** 税率 */
export type TaxRate = 0 | 8 | 10;

/** 見積書 */
export const quotationSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Quotation = z.infer<typeof quotationSchema>;

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
export type DetailItem = z.infer<typeof detailItemSchema>;

/**
 * 見積書1件分の明細配列のスキーマ。
 * Zod が配列を iterate し、issue.path = [detailIndex, fieldName] で失敗箇所を返す。
 * クロス行/クロスフィールドの検証が必要になれば superRefine をここに追加する。
 */
export const quotationDetailsSchema = z.array(detailItemSchema);

/** 保存済み明細データ（taxType はページ全体で1つなので PageForm 側に持つ） */
export const savedQuotationDetailSchema = z.object({
  quotation: quotationSchema,
  details: z.array(detailItemSchema),
  subtotal: z.number(),
});
export type SavedQuotationDetail = z.infer<typeof savedQuotationDetailSchema>;

/** ページレベルのフォームデータ（mutation payload）のベーススキーマ */
export const pageFormSchema = z.object({
  orderName: z.string().min(1, "発注名を入力してください"),
  taxType: taxTypeSchema,
  savedDetails: z.array(savedQuotationDetailSchema),
});
export type PageFormData = z.infer<typeof pageFormSchema>;

/**
 * 価格交渉金額との一致チェックを含む、外部コンテキスト付きの検証スキーマ。
 * `handleSubmit` 時に zodResolver(createPageFormSchema(negotiationPrice)) として差し込む。
 *
 * root に設定されたエラーは RHF の `formState.errors.root` で取得できる。
 */
export const createPageFormSchema = (negotiationPrice: number) =>
  pageFormSchema.superRefine((data, ctx) => {
    if (data.savedDetails.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "発注明細を追加してください",
        path: ["root"],
      });
      return;
    }
    const orderAmount = data.savedDetails.reduce((sum, d) => sum + d.subtotal, 0);
    if (orderAmount !== negotiationPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `価格交渉金額と発注金額が一致しません（価格交渉金額: ¥${negotiationPrice.toLocaleString()} / 発注金額: ¥${orderAmount.toLocaleString()}）`,
        path: ["root"],
      });
    }
  });
