import type { TaxType, DetailItem } from "../shared/types";

/** 見積書ごとのフォームエントリ */
export interface QuotationFormEntry {
  quotationId: string;
  details: DetailItem[];
}

/** パターン2: モーダルフォームデータ（全見積書を一括管理） */
export interface Pattern2ModalFormData {
  taxType: TaxType;
  quotationEntries: QuotationFormEntry[];
}
