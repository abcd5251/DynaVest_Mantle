/**
 * Harvest Finance Vault ABI
 *
 * Harvest Finance uses a custom fToken standard (predates ERC-4626).
 * Users deposit underlying assets and receive fTokens representing their vault share.
 * The value of each fToken increases over time as strategies generate yield.
 *
 * Key Functions:
 * - deposit(amount): Deposit underlying tokens, receive fTokens
 * - withdraw(shares): Burn fTokens, receive underlying tokens
 * - getPricePerFullShare(): Current conversion rate from fTokens to underlying
 *
 * Note: No deposit or withdrawal fees on Harvest Finance vaults
 */
export const HARVEST_VAULT_ABI = [
  // Write functions
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    name: "depositFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "numberOfShares", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [],
    name: "getPricePerFullShare",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "holder", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "holder", type: "address" }],
    name: "underlyingBalanceWithInvestmentForHolder",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "underlyingBalanceInVault",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "underlyingBalanceWithInvestment",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "numberOfShares", type: "uint256" }],
    name: "getEstimatedWithdrawalAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "underlyingUnit",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "underlying",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
