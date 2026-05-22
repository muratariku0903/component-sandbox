import { z } from "zod";
import { detailItemSchema, type DetailItem, type TaxType } from "../shared/types";

/** 見積書ごとのフォームエントリ */
export const quotationFormEntrySchema = z.object({
  quotationId: z.string(),
  details: z.array(detailItemSchema),
});

export interface QuotationFormEntry {
  quotationId: string;
  details: DetailItem[];
}

export const orderDetailModalFormSchema = z.object({
  taxType: z.enum(["tax_exclusive", "tax_inclusive"]),
  quotationEntries: z.array(quotationFormEntrySchema),
});

/** モーダルフォームデータ（全見積書を一括管理） */
export interface OrderDetailModalFormData {
  taxType: TaxType;
  quotationEntries: QuotationFormEntry[];
}
