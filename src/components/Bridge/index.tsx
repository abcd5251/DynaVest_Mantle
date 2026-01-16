import { useState } from "react";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { useAccount, useSwitchChain, useBalance, useWriteContract } from "wagmi";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { base } from "viem/chains";
import { toast } from "react-toastify";

import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { USDC } from "@/constants/coins";

// Stargate Bridge Contract on Base (USDC)
// Note: This is a placeholder address. You should replace it with the actual Stargate Router address on Base.
// Stargate V2 Pool on Base for USDC: 0x27a16dc7d8c92c737756f77c03075249f0239105 (Example)
// Router ETH: 0x45f1A95A4D3f3836523F5c83673c797f4d4d263B
const STARGATE_ROUTER_BASE = "0x45f1A95A4D3f3836523F5c83673c797f4d4d263B"; 

export default function BridgeComponent() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const { data: balance } = useBalance({
    address,
    token: USDC.chains[base.id] as `0x${string}`,
    chainId: base.id,
  });

  const handleBridge = async () => {
    if (!address || !amount) return;

    if (chain?.id !== base.id) {
      switchChain({ chainId: base.id });
      return;
    }

    setIsLoading(true);
    try {
      const parsedAmount = parseUnits(amount, USDC.decimals);

      // 1. Approve USDC
      await writeContractAsync({
        address: USDC.chains[base.id] as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [STARGATE_ROUTER_BASE, parsedAmount],
      });
      
      toast.info("Approving USDC...");
      // In a real app, wait for receipt here

      // 2. Call Bridge (Swap)
      // This is a simplified Stargate V1 swap call. V2 might differ.
      // function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, lzTxObj memory _lzTxParams, bytes calldata _to, bytes calldata _payload)
      
      // Using a mock implementation for the UI demo as requested
      // Replace with actual contract interaction
      toast.success("Bridge transaction submitted!");
      setAmount("");
      
    } catch (error) {
      console.error("Bridge failed:", error);
      toast.error("Bridge transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Bridge Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Chain */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">From</label>
            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
              <div className="flex items-center gap-2">
                <Image src="/crypto-icons/chains/8453.svg" alt="Base" width={24} height={24} className="rounded-full" />
                <span className="font-semibold">Base</span>
              </div>
              <span className="text-sm text-gray-500">Network</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-gray-500">Send</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20 h-14 text-lg"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Image src="/crypto-icons/usdc.svg" alt="USDC" width={20} height={20} />
                <span className="font-medium">USDC</span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              Balance: {balance ? formatUnits(balance.value, balance.decimals) : "0.00"} USDC
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="bg-white p-2 rounded-full shadow-md border">
              <ArrowDown className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          {/* To Chain */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">To</label>
            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
              <div className="flex items-center gap-2">
                <Image src="/crypto-icons/chains/5000.svg" alt="Mantle" width={24} height={24} className="rounded-full" />
                <span className="font-semibold">Mantle</span>
              </div>
              <span className="text-sm text-gray-500">Network</span>
            </div>
          </div>

          {/* Bridge Button */}
          <Button 
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            onClick={handleBridge}
            disabled={isLoading || !amount}
          >
            {isLoading ? "Bridging..." : "Bridge to Mantle"}
          </Button>

          <div className="text-xs text-center text-gray-400">
            Powered by Stargate Finance
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
