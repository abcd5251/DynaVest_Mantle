import { base } from "viem/chains";
import type { Protocol } from "@/types/strategies";

export const AVANTIS_CONTRACTS = {
  [base.id]: {
    avUSDCVault: "0x944766f715b51967E56aFdE5f0Aa76cEaCc9E7f9", // avUSDC vault token
    vaultManager: "0xe9fB8C70aF1b99F2Baaa07Aa926FCf3d237348DD",
  },
} as const;

export const AVANTIS = {
  name: "Avantis",
  description:
    "Avantis is a decentralized perpetuals trading protocol. The Avantis Vault earns yield from trading fees as the counterparty to traders on the platform.",
  icon: "/crypto-icons/protocol/avantis.png",
  link: "https://www.avantisfi.com/",
  contracts: AVANTIS_CONTRACTS,
} as const satisfies Protocol;
