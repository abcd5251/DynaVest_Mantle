export const METAMORPHO_ABI = [
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
  },
  {
    type: "function",
    name: "maxDeposit",
    stateMutability: "view",
    inputs: [
      { name: "receiver", type: "address" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "maxMint",
    stateMutability: "view",
    inputs: [
      { name: "receiver", type: "address" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "maxWithdraw",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "maxRedeem",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" }
    ],
    outputs: [
      { name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "previewDeposit",
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
    name: "previewMint",
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
    name: "previewWithdraw",
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
    name: "previewRedeem",
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
    name: "asset",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "address" }
    ]
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "string" }
    ]
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "string" }
    ]
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "uint8" }
    ]
  }
] as const;
