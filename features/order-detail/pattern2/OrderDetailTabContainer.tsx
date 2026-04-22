import { forwardRef, useState, type Ref } from "react";
import { Tabs } from "@chakra-ui/react";
import {
  OrderDetailPage,
  type OrderDetailPageHandle,
} from "./OrderDetailPage";
import {
  OrderMemoContent,
  type OrderMemoContentHandle,
  type OrderMemoFormData,
} from "./OrderMemoContent";
import type { Quotation, PageFormData } from "../shared/types";

export type ContentStatus = "order-detail" | "memo";

/**
 * 中間層が親に公開する共通 interface。
 * active な孫に ref を転送するため、孫側の Handle は全て { submit: () => void } に揃える。
 */
export interface OrderDetailTabContainerHandle {
  submit: () => void;
}

interface OrderDetailTabContainerProps {
  quotations: Quotation[];
  negotiationPrice?: number;
  initialData?: PageFormData;
  onOrderDetailSubmit: (payload: PageFormData) => void;
  onMemoSubmit: (payload: OrderMemoFormData) => void;
  /** active な孫の送信可能状態を親へ通知（pass-through） */
  onCanSubmitChange?: (canSubmit: boolean) => void;
}

export const OrderDetailTabContainer = forwardRef<
  OrderDetailTabContainerHandle,
  OrderDetailTabContainerProps
>(function OrderDetailTabContainer(
  {
    quotations,
    negotiationPrice,
    initialData,
    onOrderDetailSubmit,
    onMemoSubmit,
    onCanSubmitChange,
  },
  ref
) {
  const [active, setActive] = useState<ContentStatus>("order-detail");

  return (
    <Tabs.Root
      value={active}
      onValueChange={(e) => setActive(e.value as ContentStatus)}
    >
      <Tabs.List>
        <Tabs.Trigger value="order-detail">発注明細</Tabs.Trigger>
        <Tabs.Trigger value="memo">メモ</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="order-detail">
        {/* active な孫のみ mount する（ref の排他性を担保） */}
        {active === "order-detail" && (
          <OrderDetailPage
            ref={ref as Ref<OrderDetailPageHandle>}
            quotations={quotations}
            negotiationPrice={negotiationPrice}
            initialData={initialData}
            onSubmit={onOrderDetailSubmit}
            onCanSubmitChange={onCanSubmitChange}
          />
        )}
      </Tabs.Content>

      <Tabs.Content value="memo">
        {active === "memo" && (
          <OrderMemoContent
            ref={ref as Ref<OrderMemoContentHandle>}
            onSubmit={onMemoSubmit}
            onCanSubmitChange={onCanSubmitChange}
          />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
});
