import { flowMainnet } from "viem/chains";
import type { Protocol } from "@/types/strategies";

export const ANKR_CONTRACTS = {
  [flowMainnet.id]: {
    ankrFLOW: "0xFE8189A3016cb6A3668b8ccdAC520CE572D4287a",
  },
} as const;

export const ANKR = {
  name: "Ankr",
  description:
    "Ankr is a liquid staking protocol that allows users to stake assets while maintaining liquidity.",
  icon: "/crypto-icons/protocol/ankr.svg",
  link: "https://www.ankr.com/",
  contracts: ANKR_CONTRACTS,
} as const satisfies Protocol;
