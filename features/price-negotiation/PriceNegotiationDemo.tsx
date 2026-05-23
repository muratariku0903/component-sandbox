import { PriceNegotiationPage } from "./PriceNegotiationPage";
import type { SupplierCandidate } from "./types";

const supplierCandidates: SupplierCandidate[] = [
  { id: "supplier-1", name: "交渉先 1" },
  { id: "supplier-2", name: "交渉先 2" },
  { id: "supplier-3", name: "交渉先 3" },
];

export function PriceNegotiationDemo() {
  return <PriceNegotiationPage suppliers={supplierCandidates} />;
}
