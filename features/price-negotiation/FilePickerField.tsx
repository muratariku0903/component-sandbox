import { Button, HStack, Input, Text } from "@chakra-ui/react";
import { useRef } from "react";
import { LuUpload, LuX } from "react-icons/lu";
import type { StoredFile } from "./types";

interface FilePickerFieldProps {
  value: StoredFile;
  onChange: (value: StoredFile) => void;
  accept?: string;
  minH?: string;
  invalid?: boolean;
}

export function FilePickerField({
  value,
  onChange,
  accept,
  minH = "96px",
  invalid = false,
}: FilePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    onChange({
      file,
      fileName: file.name,
      filePath: file.name,
    });
  };

  const clearFile = () => {
    if (inputRef.current) inputRef.current.value = "";
    onChange({ file: null, fileName: "", filePath: "" });
  };

  return (
    <HStack
      border="1px dashed"
      borderColor={invalid ? "border.error" : "border.emphasized"}
      borderRadius="md"
      minH={minH}
      px={4}
      py={3}
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      flexDirection={{ base: "column", sm: "row" }}
      gap={4}
      minW={0}
      w="full"
    >
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        display="none"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />
      <Text
        color={value.fileName ? "fg" : "fg.muted"}
        fontSize="sm"
        flex="1"
        minW={0}
        overflowWrap="anywhere"
      >
        {value.fileName || "ファイルを選択"}
      </Text>
      <HStack gap={2} flexWrap="wrap" justify={{ base: "stretch", sm: "end" }}>
        {value.fileName && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearFile}
            flex={{ base: "1 1 0", sm: "0 0 auto" }}
          >
            <LuX />
            解除
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          flex={{ base: "1 1 0", sm: "0 0 auto" }}
        >
          <LuUpload />
          選択
        </Button>
      </HStack>
    </HStack>
  );
}
