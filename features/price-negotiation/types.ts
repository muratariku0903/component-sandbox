import { z } from "zod";

export type TaxType = "" | "tax_exclusive" | "tax_inclusive";
export type SelectedTaxType = "tax_exclusive" | "tax_inclusive";
export type ContactMethod = "" | "email" | "tel";
export type ReceiptCategory = "" | "electronic" | "paper";

export interface SupplierCandidate {
  id: string;
  name: string;
}

export interface StoredFile {
  file: File | null;
  fileName: string;
  filePath: string;
}

export interface CandidateNegotiation {
  supplierId: string;
  contactMethod: ContactMethod;
}

export interface FinalQuotation {
  amount: number | "";
  taxType: TaxType;
  quotationDate: string;
  quotationNo: string;
  file: StoredFile;
  receiptCategory: ReceiptCategory;
}

export interface PriceNegotiationFormData {
  candidates: CandidateNegotiation[];
  result: {
    supplierId: string;
    negotiatedAmount: number | "";
    taxType: SelectedTaxType;
    contactMemo: string;
    quotations: FinalQuotation[];
    orderFile: StoredFile;
  };
}

const browserFileSchema = z.custom<File | null>();

export const storedFileSchema = z.object({
  file: browserFileSchema,
  fileName: z.string(),
  filePath: z.string(),
});

const amountSchema = z
  .union([z.number(), z.literal(""), z.nan()])
  .refine((value) => value !== "" && !Number.isNaN(value), {
    message: "金額は必須です",
  })
  .refine((value) => value === "" || Number.isInteger(value), {
    message: "金額は整数で入力してください",
  });

export const finalQuotationSchema = z.object({
  amount: amountSchema,
  taxType: z
    .union([z.literal(""), z.literal("tax_exclusive"), z.literal("tax_inclusive")])
    .refine((value) => value !== "", {
      message: "税区分は必須です",
    }),
  quotationDate: z.string().min(1, "見積日は必須です"),
  quotationNo: z.string().max(50, "見積No.は50文字以内で入力してください"),
  file: storedFileSchema,
  receiptCategory: z.union([
    z.literal(""),
    z.literal("electronic"),
    z.literal("paper"),
  ]),
}).superRefine((quotation, ctx) => {
  if (quotation.file.fileName && !quotation.receiptCategory) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "受領区分は必須です",
      path: ["receiptCategory"],
    });
  }
});

export const priceNegotiationFormSchema = z.object({
  candidates: z.array(
    z.object({
      supplierId: z.string(),
      contactMethod: z
        .union([z.literal(""), z.literal("email"), z.literal("tel")])
        .refine((value) => value !== "", {
          message: "交渉先連絡方法は必須です",
        }),
    })
  ),
  result: z.object({
    supplierId: z.string().min(1, "発注先を選択してください"),
    negotiatedAmount: amountSchema,
    taxType: z.enum(["tax_exclusive", "tax_inclusive"]),
    contactMemo: z.string().max(500, "連絡事項は500文字以内で入力してください"),
    quotations: z
      .array(finalQuotationSchema)
      .min(1, "最終見積書は1件以上入力してください"),
    orderFile: storedFileSchema,
  }),
});

export const createEmptyStoredFile = (): StoredFile => ({
  file: null,
  fileName: "",
  filePath: "",
});

export const createEmptyFinalQuotation = (): FinalQuotation => ({
  amount: "",
  taxType: "",
  quotationDate: "",
  quotationNo: "",
  file: createEmptyStoredFile(),
  receiptCategory: "",
});
