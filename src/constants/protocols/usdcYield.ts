import { mantle } from "viem/chains";
import type { Protocol } from "@/types/strategies";

export const USDC_YIELD = {
  name: "USDC Yield Layer",
  description: "USDC Yield Layer on Mantle",
  icon: "/crypto-icons/usdc.svg", // Already pointing to correct file
  link: "https://mantle.xyz",
  contracts: {
    [mantle.id]: {
      vault: "0x0000000000000000000000000000000000000000",
    },
  },
} as const satisfies Protocol;
