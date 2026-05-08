import { Box, IconButton, Popover, Portal, Table, Text } from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";
import { CloseButton } from "@/components/ui/close-button";
import { AssigneeSelect } from "./AssigneeSelect";
import { STATUS_LABELS, type Assignee, type Inquiry } from "./types";

interface InquiryTableProps {
  inquiries: Inquiry[];
  assignees: Assignee[];
  /** 担当者選択時に即時呼び出される。即時反映 UX */
  onAssigneeChange: (inquiryId: string, assignee: Assignee | null) => void;
}

export function InquiryTable({
  inquiries,
  assignees,
  onAssigneeChange,
}: InquiryTableProps) {
  return (
    <Table.Root size="md" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>タイトル</Table.ColumnHeader>
          <Table.ColumnHeader w="120px">ステータス</Table.ColumnHeader>
          <Table.ColumnHeader w="180px">担当者</Table.ColumnHeader>
          <Table.ColumnHeader w="180px">作成日時</Table.ColumnHeader>
          <Table.ColumnHeader w="60px" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {inquiries.map((inquiry) => (
          <InquiryRow
            key={inquiry.id}
            inquiry={inquiry}
            assignees={assignees}
            onAssigneeChange={(assignee) =>
              onAssigneeChange(inquiry.id, assignee)
            }
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}

interface InquiryRowProps {
  inquiry: Inquiry;
  assignees: Assignee[];
  onAssigneeChange: (assignee: Assignee | null) => void;
}

function InquiryRow({ inquiry, assignees, onAssigneeChange }: InquiryRowProps) {
  return (
    <Table.Row
      onClick={(e) =>
        console.log("[row click]", {
          inquiryId: inquiry.id,
          title: inquiry.title,
          target: (e.target as HTMLElement).tagName,
        })
      }
    >
      <Table.Cell>{inquiry.title}</Table.Cell>
      <Table.Cell>{STATUS_LABELS[inquiry.status]}</Table.Cell>
      <Table.Cell>
        {inquiry.assignee ? (
          inquiry.assignee.name
        ) : (
          <Text color="fg.muted">未割当</Text>
        )}
      </Table.Cell>
      <Table.Cell>{formatDate(inquiry.createdAt)}</Table.Cell>
      {/*
        ポップオーバーを含むセル全体で stopPropagation。
        React 合成イベントは Portal を貫通して React tree をたどるので、
        Popover.Content / react-select のメニューからも行 onClick へバブルしてしまう。
        セル単位で止めれば、アイコン・popover ボディ・select オプション全てを
        一箇所でカバーできる。
      */}
      <Table.Cell onClick={(e) => e.stopPropagation()}>
        <Popover.Root positioning={{ placement: "bottom-end" }}>
          <Popover.Trigger asChild>
            <IconButton
              aria-label="担当者を編集"
              size="sm"
              variant="ghost"
            >
              <LuPencil />
            </IconButton>
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content>
                <Popover.Arrow />
                <Popover.CloseTrigger
                  position="absolute"
                  top="1"
                  insetEnd="1"
                  asChild
                >
                  <CloseButton size="xs" aria-label="閉じる" />
                </Popover.CloseTrigger>
                <Popover.Body>
                  <Box minW="240px" pr={6}>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      担当者
                    </Text>
                    <AssigneeSelect
                      assignees={assignees}
                      value={inquiry.assignee}
                      onChange={onAssigneeChange}
                      autoFocus
                      instanceId={`assignee-${inquiry.id}`}
                    />
                  </Box>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </Table.Cell>
    </Table.Row>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
