import { Address, encodeFunctionData } from "viem";

import { ERC20_ABI } from "@/constants/abis";

const FEE_RECEIVER: Address = process.env.NEXT_PUBLIC_FEE_RECEIVER as Address;

// Fallback fee receiver if env var is not set
const FALLBACK_FEE_RECEIVER: Address = "0x0000000000000000000000000000000000000000";
const ACTUAL_FEE_RECEIVER = FEE_RECEIVER || FALLBACK_FEE_RECEIVER;

export const calculateFee = (amount: bigint, fee: bigint = BigInt(0)) => {
  return {
    fee: (amount * fee) / BigInt(1000),
    amount: amount - (amount * fee) / BigInt(1000),
  };
};

export const addFeesCall = (
  asset: Address,
  isNativeToken: boolean,
  fee: bigint
) => {
  if (isNativeToken) {
    return {
      to: ACTUAL_FEE_RECEIVER,
      value: fee,
    };
  } else {
    return {
      to: asset,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [ACTUAL_FEE_RECEIVER, fee],
      }),
    };
  }
};
