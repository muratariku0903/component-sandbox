import { useState } from "react";
import Head from "next/head";
import { Box, Heading } from "@chakra-ui/react";
import { InquiryTable } from "@/features/inquiry/InquiryTable";
import { mockAssignees, mockInquiries } from "@/features/inquiry/mocks";
import type { Assignee } from "@/features/inquiry/types";

export default function InquiryRoute() {
  const [inquiries, setInquiries] = useState(mockInquiries);

  const handleAssigneeChange = (inquiryId: string, assignee: Assignee | null) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, assignee } : inq
      )
    );
  };

  return (
    <>
      <Head>
        <title>問い合わせ一覧</title>
      </Head>
      <Box maxW="1100px" mx="auto" p={6}>
        <Heading size="lg" mb={6}>
          問い合わせ一覧
        </Heading>
        <InquiryTable
          inquiries={inquiries}
          assignees={mockAssignees}
          onAssigneeChange={handleAssigneeChange}
        />
      </Box>
    </>
  );
}
