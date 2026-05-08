import Select from "react-select";
import type { Assignee } from "./types";

interface AssigneeOption {
  value: string;
  label: string;
}

interface AssigneeSelectProps {
  assignees: Assignee[];
  value: Assignee | null;
  onChange: (assignee: Assignee | null) => void;
  autoFocus?: boolean;
  /**
   * react-select 内部 ID の prefix。SSR とクライアントで一致させるため、
   * 親側で安定した文字列（例: 行 ID）を渡すこと。
   */
  instanceId: string;
}

export function AssigneeSelect({
  assignees,
  value,
  onChange,
  autoFocus,
  instanceId,
}: AssigneeSelectProps) {
  const options: AssigneeOption[] = assignees.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const selected: AssigneeOption | null = value
    ? { value: value.id, label: value.name }
    : null;

  return (
    <Select<AssigneeOption>
      instanceId={instanceId}
      options={options}
      value={selected}
      onChange={(option) => {
        if (!option) {
          onChange(null);
          return;
        }
        const assignee = assignees.find((a) => a.id === option.value) ?? null;
        onChange(assignee);
      }}
      isClearable
      isSearchable
      autoFocus={autoFocus}
      placeholder="担当者を検索..."
      noOptionsMessage={() => "該当する担当者がいません"}
      // メニューを portal せず popover 内に直接描画する。
      // → option クリック時に Chakra Popover の closeOnBlur が誤発火しない（focus が popover 外へ出ないため）
      // → popover 外クリックでの自動クローズはそのまま機能する
      menuPosition="absolute"
    />
  );
}
