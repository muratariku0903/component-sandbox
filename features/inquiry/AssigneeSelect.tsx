import { useEffect, useState } from "react";
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
  // Popover の中で react-select のメニューが見切れないよう、メニューだけ document.body に portal する。
  // SSR で document が無い場合のフォールバックとして mount 後にセット。
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMenuPortalTarget(document.body);
  }, []);

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
      menuPortalTarget={menuPortalTarget}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
}
