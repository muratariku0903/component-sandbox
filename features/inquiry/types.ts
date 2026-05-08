/** 問い合わせステータス */
export type InquiryStatus = "open" | "in_progress" | "resolved" | "closed";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "解決済み",
  closed: "クローズ",
};

/** 担当者 */
export interface Assignee {
  id: string;
  name: string;
}

/** 問い合わせ1件 */
export interface Inquiry {
  id: string;
  title: string;
  status: InquiryStatus;
  assignee: Assignee | null;
  /** ISO 8601 形式の作成日時 */
  createdAt: string;
}
