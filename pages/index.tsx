import Head from "next/head";
import Link from "next/link";
import { Box, VStack, Text, Button } from "@chakra-ui/react";

export default function Home() {
  return (
    <>
      <Head>
        <title>パーツ一覧</title>
      </Head>
      <Box maxW="600px" mx="auto" p={6}>
        <Text fontSize="xl" fontWeight="bold" mb={6}>
          パーツ一覧
        </Text>
        <VStack gap={4} align="stretch">
          <Link href="/order-detail">
            <Button variant="outline" width="100%" justifyContent="flex-start">
              発注明細
            </Button>
          </Link>
        </VStack>
      </Box>
    </>
  );
}
