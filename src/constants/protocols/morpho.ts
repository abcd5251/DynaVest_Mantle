import { base } from "viem/chains";

import type { Protocol } from "@/types/strategies";

export const MORPHO = {
  name: "Morpho",
  description:
    "Morpho is a decentralized lending protocol that allows users to lend and borrow assets.",
  icon: "/crypto-icons/protocol/morpho.svg",
  link: "https://morpho.org/",
  contracts: {
    [base.id]: {
      morpho: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      re7Vault: "0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e", // Re7 USDC vault
      bbqVault: "0xBEEFA7B88064FeEF0cEe02AAeBBd95D30df3878F", // Steakhouse High Yield USDC v11
      csVault: "0x1D3b1Cd0a0f242d598834b3F2d126dC6bd774657", // ClearStar USDC Reactor
      extrafiVault: "0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e", // ExtraFi xLend USDC
      steakhousePrimeVault: "0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2", // Steakhouse Prime USDC
      highYieldClearStarVault: "0xE74c499fA461AF1844fCa84204490877787cED56", // High Yield ClearStar USDC
    },
  },
} as const satisfies Protocol;
