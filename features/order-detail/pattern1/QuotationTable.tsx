import { Box, Table, Text } from "@chakra-ui/react";
import type { SavedQuotationDetail } from "../shared/types";

interface QuotationTableProps {
  detail: SavedQuotationDetail;
}

export function QuotationTable({ detail }: QuotationTableProps) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="bold" mb={2}>
        {detail.quotation.name}
      </Text>
      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="40px"></Table.ColumnHeader>
            <Table.ColumnHeader>商品名</Table.ColumnHeader>
            <Table.ColumnHeader>商品型</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">金額</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {detail.details.map((item, index) => (
            <Table.Row key={index}>
              <Table.Cell>明細{index + 1}</Table.Cell>
              <Table.Cell>{item.productName}</Table.Cell>
              <Table.Cell>{item.modelNumber}</Table.Cell>
              <Table.Cell textAlign="right">
                {(Number(item.amount) || 0).toLocaleString()}円
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell colSpan={3} textAlign="right" fontWeight="bold">
              小計
            </Table.Cell>
            <Table.Cell textAlign="right" fontWeight="bold">
              {detail.subtotal.toLocaleString()}円
            </Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Box>
  );
}
