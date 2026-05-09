import type { Assignee, Inquiry } from "./types";

export const mockAssignees: Assignee[] = [
  { id: "u1", name: "山田 太郎" },
  { id: "u2", name: "佐藤 花子" },
  { id: "u3", name: "田中 次郎" },
  { id: "u4", name: "鈴木 一郎" },
  { id: "u5", name: "高橋 三郎" },
  { id: "u6", name: "伊藤 美咲" },
  { id: "u7", name: "渡辺 健太" },
  { id: "u8", name: "中村 裕子" },
  { id: "u9", name: "小林 雄介" },
  { id: "u10", name: "加藤 さくら" },
];

export const mockInquiries: Inquiry[] = [
  {
    id: "i1",
    title: "ログインできない",
    status: "open",
    assignee: null,
    createdAt: "2026-04-15T09:30:00Z",
  },
  {
    id: "i2",
    title: "決済エラーが発生する",
    status: "in_progress",
    assignee: mockAssignees[0],
    createdAt: "2026-04-12T14:20:00Z",
  },
  {
    id: "i3",
    title: "アカウント削除依頼",
    status: "resolved",
    assignee: mockAssignees[2],
    createdAt: "2026-04-10T11:00:00Z",
  },
  {
    id: "i4",
    title: "請求書フォーマット変更要望",
    status: "open",
    assignee: null,
    createdAt: "2026-04-08T16:45:00Z",
  },
  {
    id: "i5",
    title: "ファイルのアップロードに失敗",
    status: "in_progress",
    assignee: mockAssignees[1],
    createdAt: "2026-04-05T10:15:00Z",
  },
  {
    id: "i6",
    title: "メール通知が届かない",
    status: "closed",
    assignee: mockAssignees[5],
    createdAt: "2026-03-28T13:00:00Z",
  },
];
