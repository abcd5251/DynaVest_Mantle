import { celo } from "viem/chains";
import type { Protocol } from "@/types/strategies";

export const ST_CELO_CONTRACTS = {
  [celo.id]: {
    manager: "0x0239b96D10a434a56CC9E09383077A0490cF9398",
  },
} as const;

export const ST_CELO = {
  name: "StCelo",
  description:
    "Liquid staking protocol for CELO tokens.",
  icon: "/crypto-icons/chains/42220.svg",
  link: "https://celo.org/",
  contracts: ST_CELO_CONTRACTS,
} as const satisfies Protocol;
