import Head from "next/head";
import Link from "next/link";
import { Box, VStack, Text, Button } from "@chakra-ui/react";

export default function OrderDetailIndex() {
  return (
    <>
      <Head>
        <title>発注明細 - パターン選択</title>
      </Head>
      <Box maxW="600px" mx="auto" p={6}>
        <Text fontSize="xl" fontWeight="bold" mb={6}>
          発注明細 実装パターン
        </Text>
        <VStack gap={4} align="stretch">
          <Link href="/order-detail/pattern2">
            <Button variant="outline" width="100%" justifyContent="flex-start">
              パターン2: ネスト useFieldArray（RHF 内データ管理）
            </Button>
          </Link>
        </VStack>
      </Box>
    </>
  );
}
