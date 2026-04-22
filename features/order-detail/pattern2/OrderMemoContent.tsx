import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Box, Input, Text, VStack } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Field } from "@/components/ui/field";

/** デモ用の別孫。発注明細とは別 API に投げる想定 */
export interface OrderMemoFormData {
  memo: string;
}

export interface OrderMemoContentHandle {
  submit: () => void;
}

interface OrderMemoContentProps {
  onSubmit?: (payload: OrderMemoFormData) => void;
  /** 送信可能かどうか（メモが1文字以上）の変化を親へ通知 */
  onCanSubmitChange?: (canSubmit: boolean) => void;
}

export const OrderMemoContent = forwardRef<OrderMemoContentHandle, OrderMemoContentProps>(
  function OrderMemoContent({ onSubmit, onCanSubmitChange }, ref) {
    const form = useForm<OrderMemoFormData>({
      defaultValues: { memo: "" },
    });

    const memo = form.watch("memo");
    const canSubmit = memo.trim().length > 0;

    useEffect(() => {
      onCanSubmitChange?.(canSubmit);
      return () => onCanSubmitChange?.(false);
    }, [canSubmit, onCanSubmitChange]);

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          form.handleSubmit((data) => {
            onSubmit?.(data);
          })();
        },
      }),
      [form, onSubmit]
    );

    return (
      <Box maxW="960px" mx="auto" p={6}>
        <VStack gap={4} align="stretch">
          <Text fontWeight="bold">メモコンテンツ（別孫・別 API 想定）</Text>
          <Field
            label="メモ"
            invalid={!!form.formState.errors.memo}
            errorText={form.formState.errors.memo?.message}
          >
            <Input
              {...form.register("memo", { required: "メモを入力してください" })}
              placeholder="メモを入力"
            />
          </Field>
        </VStack>
      </Box>
    );
  }
);
