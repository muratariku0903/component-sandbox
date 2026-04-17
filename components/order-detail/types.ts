/** 税区分 */
export type TaxType = "tax_exclusive" | "tax_inclusive";

/** 税率 */
export type TaxRate = 8 | 10;

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

/** ページレベルのフォームデータ（認可依頼ペイロード） */
export interface PageFormData {
  orderName: string;
  savedDetails: SavedQuotationDetail[];
}
