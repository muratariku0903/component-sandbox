import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";
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
    <TableContainer>
      <Table size="md" variant="simple">
        <Thead>
          <Tr>
            <Th>タイトル</Th>
            <Th w="120px">ステータス</Th>
            <Th w="180px">担当者</Th>
            <Th w="180px">作成日時</Th>
            <Th w="60px" />
          </Tr>
        </Thead>
        <Tbody>
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
        </Tbody>
      </Table>
    </TableContainer>
  );
}

interface InquiryRowProps {
  inquiry: Inquiry;
  assignees: Assignee[];
  onAssigneeChange: (assignee: Assignee | null) => void;
}

function InquiryRow({ inquiry, assignees, onAssigneeChange }: InquiryRowProps) {
  return (
    <Tr
      onClick={(e) =>
        console.log("[row click]", {
          inquiryId: inquiry.id,
          title: inquiry.title,
          target: (e.target as HTMLElement).tagName,
        })
      }
    >
      <Td>{inquiry.title}</Td>
      <Td>{STATUS_LABELS[inquiry.status]}</Td>
      <Td>
        {inquiry.assignee ? (
          inquiry.assignee.name
        ) : (
          <Text color="gray.500">未割当</Text>
        )}
      </Td>
      <Td>{formatDate(inquiry.createdAt)}</Td>
      {/*
        セル自体には stopPropagation を仕掛けない。
        セル全体で止めるとアイコン横の余白クリックも行クリック対象外になってしまう。
        代わりに「編集アイコンそのもの」と「ポップオーバー内部」の2箇所だけで止める。
      */}
      <Td>
        <Popover placement="bottom-end">
          <PopoverTrigger>
            <IconButton
              aria-label="担当者を編集"
              size="sm"
              variant="ghost"
              icon={<LuPencil />}
              onClick={(e) => e.stopPropagation()}
            />
          </PopoverTrigger>
          <Portal>
            {/*
              ポップオーバー内部（×ボタン・本文・react-select オプション）からの
              合成イベントが Portal を貫通して行へバブルするのを Content で一括ブロック
            */}
            <PopoverContent onClick={(e) => e.stopPropagation()}>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody>
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
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
      </Td>
    </Tr>
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
