export const ANKR_FLOW_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "unstake",
    inputs: [
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      { name: "account", type: "address" },
    ],
    outputs: [
      { name: "", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sharesToBonds",
    inputs: [
      { name: "shares", type: "uint256" },
    ],
    outputs: [
      { name: "", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;
