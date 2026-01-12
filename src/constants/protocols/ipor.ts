import { base } from "viem/chains";
import type { Protocol } from "@/types/strategies";

export const IPOR_CONTRACTS = {
  [base.id]: {
    yoUSDVault: "0x1166250d1d6b5a1dbb73526257f6bb2bbe235295", // yoUSD Loooper vault
    accessManager: "0xbF28EFa4CBD9bE1A5447BC69f6a451C7F7EAa8a5",
    withdrawManager: "0x40e609De1B52511B0B1aCccDB0B565803b0605E3",
    priceOracle: "0x2201f5ec61Bc490E499c10a36aC79dA850e84fC5",
  },
} as const;

export const IPOR = {
  name: "IPOR Fusion",
  description:
    "IPOR Fusion is a DeFi yield optimization protocol offering automated looping strategies for maximized returns on USDC deposits.",
  icon: "/crypto-icons/protocol/ipor.png",
  link: "https://app.ipor.io/",
  contracts: IPOR_CONTRACTS,
} as const satisfies Protocol;
