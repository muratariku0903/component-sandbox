import type { DetailItem, TaxType } from "../shared/types";

/** 見積書ごとのフォームエントリ */
export interface QuotationFormEntry {
  quotationId: string;
  details: DetailItem[];
}

/**
 * パターン2: モーダルフォームデータ（全見積書を一括管理）
 * taxType はモーダル内の入力（radio）として form で管理する。
 * 保存時にページ側 form へまとめて commit、キャンセル時は破棄される。
 */
export interface Pattern2ModalFormData {
  taxType: TaxType;
  quotationEntries: QuotationFormEntry[];
}
