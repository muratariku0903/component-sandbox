import { HStack, Box, Text } from "@chakra-ui/react";

interface OrderDetailSummaryProps {
  negotiationPrice: number;
  orderAmount: number;
  taxAmount: number;
  hasDetails: boolean;
}

export function OrderDetailSummary({
  negotiationPrice,
  orderAmount,
  taxAmount,
  hasDetails,
}: OrderDetailSummaryProps) {
  return (
    <HStack gap={6} flexWrap="wrap">
      <SummaryCard label="価格交渉金額" value={negotiationPrice} />
      {hasDetails && (
        <>
          <SummaryCard label="発注金額" value={orderAmount} />
          <SummaryCard label="消費税" value={taxAmount} />
        </>
      )}
    </HStack>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      p={4}
      minW="160px"
    >
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold">
        {value.toLocaleString()}円
      </Text>
    </Box>
  );
}
