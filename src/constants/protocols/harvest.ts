import { base } from "viem/chains";
import type { Protocol } from "@/types/strategies";

/**
 * Harvest Finance Protocol Contracts on Base
 *
 * Harvest Finance is a yield aggregator that automatically farms the highest yield available
 * from latest DeFi protocols, and optimizes the yields that are received using the latest farming techniques.
 */
export const HARVEST_CONTRACTS = {
  [base.id]: {
    // 40 Acres USDC Vault - Higher APY, larger TVL
    fortyAcresUSDC: "0xC777031D50F632083Be7080e51E390709062263E",
    // Autopilot USDC Vault - More stable APY
    autopilotUSDC: "0x0d877Dc7C8Fa3aD980DfDb18B48eC9F8768359C4",
  },
} as const;

/**
 * Harvest Finance Protocol Definition
 */
export const HARVEST = {
  name: "Harvest Finance",
  description:
    "Harvest Finance is a yield optimizer that automatically compounds rewards from DeFi protocols. Users deposit assets into vaults and receive fTokens representing their share, which appreciate in value as the vault generates yield.",
  icon: "/crypto-icons/protocol/harvest.svg",
  link: "https://harvest.finance/",
  contracts: HARVEST_CONTRACTS,
} as const satisfies Protocol;
