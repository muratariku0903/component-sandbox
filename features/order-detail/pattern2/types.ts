import type { TaxType, DetailItem } from "../shared/types";

/** 見積書ごとのフォームエントリ */
export interface QuotationFormEntry {
  quotationId: string;
  details: DetailItem[];
}

/** モーダルフォームデータ（全見積書を一括管理） */
export interface OrderDetailModalFormData {
  taxType: TaxType;
  quotationEntries: QuotationFormEntry[];
}
