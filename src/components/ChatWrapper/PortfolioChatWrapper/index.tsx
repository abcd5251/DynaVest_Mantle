import React, { useEffect, useState } from "react";
import { MoveUpRight, Percent } from "lucide-react";
import { parseUnits, formatUnits } from "viem";
import { toast } from "react-toastify";
import axios from "axios";
import { usePrivy } from "@privy-io/react-auth";
import { MoonLoader } from "react-spinners";
import { mantle } from "viem/chains";

import { RiskLevel, RiskPortfolioStrategies } from "@/types";
import type { Message, PortfolioMessage } from "@/classes/message";
import { RISK_OPTIONS } from "@/constants/risk";
import { createPieChartStrategies } from "@/utils/pie";
import { getRiskDescription } from "../../RiskPortfolio";
import { PortfolioPieChart } from "../../RiskPortfolio/PieChart";
import { RiskBadgeList } from "../../RiskBadgeList";
import Button from "@/components/Button";
import { USDC } from "@/constants/coins";
import useBalance from "@/hooks/useBalance";
import { getStrategy } from "@/utils/strategies";
import { MultiStrategy } from "@/classes/strategies/multiStrategy";
import { useStrategy } from "@/hooks/useStrategy";
import { useAssets } from "@/contexts/AssetsContext";
import { updatePosition } from "@/hooks/useStrategy/utils";
import { useTransaction } from "@/components/Profile/TransactionsTable/useTransaction";

interface PortfolioChatWrapperProps {
  message: PortfolioMessage;
  addBotMessage: (message: Message) => Promise<void>;
}

const PortfolioChatWrapper: React.FC<PortfolioChatWrapperProps> = ({
  message,
  addBotMessage,
}) => {
  const { authenticated, user } = usePrivy();
  const { login } = useAssets();
  const [risk, setRisk] = useState<RiskLevel>(message.risk);
  const [strategies, setStrategies] = useState<RiskPortfolioStrategies[]>(
    message.strategies
  );
  const [isEdit, setIsEdit] = useState(true);
  const { addTx } = useTransaction();

  // TODO: hardcode USDC
  const { balance, isLoadingBalance } = useBalance(USDC);
  const { multiInvest } = useStrategy();

  const totalAPY = strategies.reduce((acc, strategy) => {
    return acc + (strategy.apy * strategy.allocation) / 100;
  }, 0);

  const handleBuildPortfolio = async () => {
    if (!authenticated) {
      login();
      return;
    } else {
      await nextMessage("build");
    }
  };

  const nextMessage = async (action: "build" | "edit") => {
    if (isLoadingBalance) return;

    message.risk = risk;
    message.strategies = strategies;

    setIsEdit(false);

    if (action === "build") {
      if (
        // TODO: hardcode USDC
        parseUnits(message.amount, USDC.decimals) >
        parseUnits(balance.toString(), USDC.decimals)
      ) {
        await addBotMessage(message.next("deposit"));
      } else {
        await executeMultiStrategy();
      }
    } else {
      await addBotMessage(message.next(action));
    }
  };

  async function executeMultiStrategy() {
    const mantleStrategies = strategies.filter((s) => s.chainId === mantle.id);
    const otherStrategies = strategies.filter((s) => s.chainId !== mantle.id);

    try {
      // 1. Execute Base/Other strategies via standard flow
      let txHash = "";
      if (otherStrategies.length > 0) {
        const strategiesHandlers = otherStrategies.map((strategy) => ({
          strategy: getStrategy(strategy.id as any, strategy.chainId),
          allocation: strategy.allocation,
        }));
        const multiStrategy = new MultiStrategy(strategiesHandlers);

        // Calculate total amount for these strategies
        const totalOtherAllocation = otherStrategies.reduce((sum, s) => sum + s.allocation, 0);
        const totalAmount = parseUnits(message.amount, USDC.decimals);
        const amountForOther = (totalAmount * BigInt(totalOtherAllocation)) / BigInt(100);

        if (amountForOther > BigInt(0)) {
           // We pass full amount to multiInvest, but multiInvest splits based on allocation.
           // Wait, multiInvest takes "amount" and splits it based on strategy.allocation.
           // But strategy.allocation sums to 100 usually.
           // Here, otherStrategies allocation sum < 100.
           // MultiStrategy logic: (amount * strategy.allocation) / 100.
           // So if we pass the FULL amount, it will calculate correctly relative to the full portfolio.
           // e.g. 100 USDC. Strategy A is 25%. Invests 25 USDC.
           // Correct.
           
           txHash = await multiInvest.mutateAsync({
            multiStrategy,
            amount: totalAmount,
            token: USDC,
          });
          toast.success(`Base strategies executed successfully, ${txHash}`);
        }
      }

      // 2. Execute Mantle strategies via Script API
      if (mantleStrategies.length > 0) {
        const totalMantleAllocation = mantleStrategies.reduce((sum, s) => sum + s.allocation, 0);
        const totalAmount = parseUnits(message.amount, USDC.decimals);
        const amountForMantle = (totalAmount * BigInt(totalMantleAllocation)) / BigInt(100);
        const amountForMantleString = formatUnits(amountForMantle, USDC.decimals);

        toast.info("Executing Mantle strategies...");
        
        try {
          const response = await axios.post('/api/mantle-strategy', {
            amount: amountForMantleString
          });

          if (response.data.success) {
            toast.success("Mantle strategies executed successfully");
            
            const txHashes = response.data.result.txHashes || [];
            // Use the last hash as the primary one, or a fallback if empty
            const primaryHash = txHashes.length > 0 ? txHashes[txHashes.length - 1] : ("0x" + "0".repeat(64));

            // Record positions and transactions manually
            for (const strategy of mantleStrategies) {
               const strategyAmount = (totalAmount * BigInt(strategy.allocation)) / BigInt(100);
               const strategyAmountNumber = Number(formatUnits(strategyAmount, USDC.decimals));
               
               if (user?.wallet?.address) {
                 await updatePosition({
                    address: user.wallet.address as `0x${string}`,
                    amount: strategyAmountNumber,
                    token_name: "USDC",
                    chain_id: mantle.id,
                    strategy: strategy.id, // Use strategy ID for correct retrieval
                 });

                 await addTx.mutateAsync({
                    address: user.wallet.address as `0x${string}`,
                    chain_id: mantle.id,
                    strategy: strategy.id, // Use strategy ID
                    hash: primaryHash, // Use real hash from script
                    amount: strategyAmountNumber,
                    token_name: "USDC",
                    transaction_type: "deposit",
                  });
               }
            }
          } else {
             toast.error(`Mantle execution failed: ${response.data.error}`);
          }
        } catch (err: any) {
           console.error("Mantle API error:", err);
           toast.error(`Mantle strategy failed: ${err.message}`);
        }
      }

      await addBotMessage(message.next("build"));
    } catch (error) {
      console.error("Error building portfolio:", error);
      if (axios.isAxiosError(error) && error.response) {
        // const errorData = JSON.parse(error.response.data); // Often response.data is already object
        const errorData = error.response.data;
        console.error("Error response data:", errorData);
        toast.error(`Error building portfolio: ${errorData.message || error.message}`);
      } else {
        toast.error(`Error building portfolio: ${error}`);
      }
    }
  }

  useEffect(() => {
    setStrategies(message.strategiesSet[risk]);
  }, [risk]);

  return (
    <div className="mt-4 overflow-x-auto max-w-full w-full flex justify-center">
      <div className="w-full max-w-[320px] md:max-w-none">
        <div className="flex flex-col gap-3">
          <div className="rounded-[0px_10px_10px_10px] p-4 flex flex-col gap-6">
            {/* Risk preference selection */}
            <RiskBadgeList
              selectedRisk={risk}
              isEditable={isEdit}
              setSelectedRiskLevel={setRisk}
              options={RISK_OPTIONS}
            />

            <div className="flex flex-col text-xs md:text-sm font-normal px-1 gap-2">
              <div className="text-gray">
                <p>{getRiskDescription(message.risk)}</p>

                <p className="font-bold">
                  Average Portfolio APY: {totalAPY.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col gap-6 w-full max-w-[805px]">
          {/* Portfolio visualization */}
          <div className="flex items-center w-full px-[10px] gap-[10px]">
            {/* Pie chart */}
            <div className="w-full">
              <PortfolioPieChart
                pieStrategies={createPieChartStrategies(strategies)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-5 md:flex-row">
            <Button
              onClick={() => nextMessage("edit")}
              text="Change Percentage"
              disabled={!isEdit}
              icon={<Percent />}
            />

            {multiInvest.isPending ? (
              <button
                className="w-full cursor-pointer max-w-[250px] flex items-center justify-center gap-2.5 rounded-lg bg-[#5F79F1] text-white py-3.5 px-5 disabled:opacity-50"
                disabled={multiInvest.isPending}
              >
                <MoonLoader size={12} />
              </button>
            ) : (
              <Button
                onClick={handleBuildPortfolio}
                text="Start Building Portfolio"
                disabled={!isEdit}
                icon={<MoveUpRight />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChatWrapper;
