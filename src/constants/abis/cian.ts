export const CIAN_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" }
    ],
    outputs: [
      { name: "shares", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "redeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" }
    ],
    outputs: [
      { name: "assets", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" }
    ],
    outputs: [
      { name: "shares", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" }
    ],
    outputs: [
      { name: "assets", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "convertToShares",
    stateMutability: "view",
    inputs: [
      { name: "assets", type: "uint256" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "convertToAssets",
    stateMutability: "view",
    inputs: [
      { name: "shares", type: "uint256" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  }
] as const;
