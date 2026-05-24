import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Provider } from "@/components/ui/provider";
import { PriceNegotiationPage } from "../PriceNegotiationPage";
import type { SupplierCandidate } from "../types";

const suppliers: SupplierCandidate[] = [
  { id: "supplier-1", name: "交渉先 1" },
  { id: "supplier-2", name: "交渉先 2" },
  { id: "supplier-3", name: "交渉先 3" },
];

function renderPage() {
  return render(
    <Provider>
      <PriceNegotiationPage suppliers={suppliers} />
    </Provider>
  );
}

function getSupplierSelect(): HTMLSelectElement {
  const select = screen
    .getAllByRole("combobox")
    .find((element) =>
      element.querySelector('option[value="supplier-1"]')
    ) as HTMLSelectElement | undefined;

  if (!select) throw new Error("supplier select not found");
  return select;
}

async function startNegotiation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "交渉開始" }));
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByLabelText("メール")[0]);
  await user.click(screen.getAllByLabelText("メール")[1]);
  await user.click(screen.getAllByLabelText("メール")[2]);
  await user.selectOptions(getSupplierSelect(), "supplier-1");
  const amountInputs = screen.getAllByPlaceholderText("0");
  await user.type(amountInputs[0], "1000");
  await user.type(amountInputs[1], "1000");
  const dateInput = document.querySelector('input[type="date"]');
  if (!dateInput) throw new Error("date input not found");
  await user.type(dateInput, "2026-05-24");
  await user.click(screen.getAllByLabelText("税込").at(-1)!);
}

describe("PriceNegotiationPage", () => {
  it("価格交渉前は交渉結果を表示せず、交渉開始で入力フォームを表示する", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("価格交渉前")).toBeInTheDocument();
    expect(screen.queryByText("交渉結果")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("メール")[0]).toBeDisabled();

    await startNegotiation(user);

    expect(screen.getByText("価格交渉中")).toBeInTheDocument();
    expect(screen.getByText("交渉結果")).toBeInTheDocument();
    expect(screen.getAllByLabelText("メール")[0]).not.toBeDisabled();
  });

  it("認可依頼時にZodバリデーションのエラーを表示する", async () => {
    const user = userEvent.setup();
    renderPage();

    await startNegotiation(user);
    await user.click(screen.getByRole("button", { name: "認可依頼" }));

    expect(screen.getAllByText("交渉先連絡方法は必須です")).toHaveLength(3);
    expect(screen.getByText("発注先を選択してください")).toBeInTheDocument();
    expect(screen.getAllByText("金額は必須です").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("見積日は必須です")).toBeInTheDocument();
    expect(screen.getByText("税区分は必須です")).toBeInTheDocument();
  });

  it("認可依頼成功で認可待ち表示になり、認可ボタンで認可後へ遷移する", async () => {
    const user = userEvent.setup();
    renderPage();

    await startNegotiation(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "認可依頼" }));

    expect(screen.getByText("価格交渉認可待ち")).toBeInTheDocument();
    expect(screen.getAllByText("1,000円（税込）").length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole("button", { name: "認可" }));
    expect(screen.getByText("価格交渉認可後")).toBeInTheDocument();
  });

  it("認可待ちの見積書編集をキャンセルすると編集前の値に戻る", async () => {
    const user = userEvent.setup();
    renderPage();

    await startNegotiation(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "認可依頼" }));

    const quotationCard = screen.getByText("最終見積書 1").closest("div");
    expect(quotationCard).not.toBeNull();
    await user.click(within(quotationCard as HTMLElement).getByLabelText("最終見積書メニュー"));
    await user.click(screen.getByText("編集"));

    const amountInput = screen.getByPlaceholderText("0");
    await user.clear(amountInput);
    await user.type(amountInput, "2000");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.getAllByText("1,000円（税込）").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("2,000円（税込）")).not.toBeInTheDocument();
  });

  it("認可待ちの見積書編集は保存時にバリデーションする", async () => {
    const user = userEvent.setup();
    renderPage();

    await startNegotiation(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "認可依頼" }));

    const quotationCard = screen.getByText("最終見積書 1").closest("div");
    expect(quotationCard).not.toBeNull();
    await user.click(within(quotationCard as HTMLElement).getByLabelText("最終見積書メニュー"));
    await user.click(screen.getByText("編集"));

    await user.clear(screen.getByPlaceholderText("0"));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByText("金額は必須です")).toBeInTheDocument();
  });

  it("認可待ちの見積書削除は2件目以降のみ可能", async () => {
    const user = userEvent.setup();
    renderPage();

    await startNegotiation(user);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "最終見積書追加" }));
    await user.type(screen.getAllByPlaceholderText("0")[2], "2000");
    const dateInputs = document.querySelectorAll('input[type="date"]');
    await user.type(dateInputs[1], "2026-05-25");
    await user.click(screen.getAllByLabelText("税込").at(-1)!);
    await user.click(screen.getByRole("button", { name: "認可依頼" }));

    await user.click(screen.getAllByLabelText("最終見積書メニュー")[0]);
    expect(screen.queryByText("削除")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getAllByLabelText("最終見積書メニュー")[1]);
    await user.click(screen.getByText("削除"));

    expect(screen.queryByText("最終見積書 2")).not.toBeInTheDocument();
    expect(screen.getByText("最終見積書 1")).toBeInTheDocument();
  });
});
