import { mantle } from "viem/chains";

import type { Protocol } from "@/types/strategies";

export const CIAN = {
  name: "CIAN",
  description: "Yield Layer of DeFi",
  icon: "/crypto-icons/cian.svg",
  link: "https://cian.app/",
  contracts: {
    [mantle.id]: {
      vault: "0x6B2BA8F249cC1376f2A02A9FaF8BEcA5D7718DCf",
    },
  },
} as const satisfies Protocol;
