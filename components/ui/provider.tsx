import { ChakraProvider } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

export function Provider({ children }: PropsWithChildren) {
  return <ChakraProvider>{children}</ChakraProvider>;
}
