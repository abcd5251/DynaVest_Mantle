import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChainId } from "wagmi";
import { formatAmount } from "@/utils";
import { toast } from "react-toastify";
import { parseUnits } from "viem";

import { getTokenByName } from "@/utils/coins";
import { getChain } from "@/constants/chains";
import { useStrategy } from "@/hooks/useStrategy";
import { getStrategy, getStrategyMetadata } from "@/utils/strategies";
import { type Position } from "@/types/position";
import { useProfit } from "./useProfit";
import type { StrategyMetadata } from "@/types";
import InvestModal from "@/components/StrategyList/StrategyCard/InvestModal";
import { useAssets } from "@/contexts/AssetsContext";
import { useTransaction } from "../TransactionsTable/useTransaction";

interface PositionTableRowProps {
  position: Position;
  index: number;
}

export default function PositionTableRow({
  position,
  index,
}: PositionTableRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const token = getTokenByName(position.tokenName);

  const { pricesQuery } = useAssets();
  const { data: profit = 0 } = useProfit(position);
  const { redeem, invest } = useStrategy();
  const chainId = useChainId();
  const { transactions } = useTransaction();
  const { data: transactionHistory = [] } = transactions;

  const price = pricesQuery.data?.[token.name] || 0;

  const strategyMetadata = getStrategyMetadata(
    position.strategy,
    position.chainId
  );

  // Find the most recent deposit transaction for this strategy
  const mostRecentDeposit = transactionHistory
    .filter(tx => 
      tx.strategy === position.strategy && 
      tx.transaction_type === 'deposit' &&
      tx.chain_id === position.chainId
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  // Calculate cooldown status using the most recent deposit transaction
  const COOLDOWN_MINUTES = 5;
  const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;
  
  // Use the most recent deposit time, or fallback to position.updatedAt
  let lastDepositTime: number;
  try {
    if (mostRecentDeposit && mostRecentDeposit.created_at) {
      lastDepositTime = new Date(mostRecentDeposit.created_at).getTime();
      // Validate the date
      if (isNaN(lastDepositTime)) {
        throw new Error('Invalid deposit date');
      }
    } else if (position.updatedAt) {
      lastDepositTime = new Date(position.updatedAt).getTime();
      // Validate the date
      if (isNaN(lastDepositTime)) {
        throw new Error('Invalid position date');
      }
    } else {
      // Fallback to current time minus cooldown (so no cooldown)
      lastDepositTime = Date.now() - COOLDOWN_MS;
    }
  } catch (error) {
    console.warn('Date parsing error, disabling cooldown:', error);
    // Fallback to current time minus cooldown (so no cooldown)
    lastDepositTime = Date.now() - COOLDOWN_MS;
  }
    
  const currentTime = Date.now();
  const timeSinceDeposit = currentTime - lastDepositTime;
  const cooldownRemaining = Math.max(0, COOLDOWN_MS - timeSinceDeposit);
  const isInCooldown = cooldownRemaining > 0;
  
  // Format remaining time
  const formatCooldownTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update cooldown every second
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (isInCooldown) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isInCooldown]);

  // Debug logging for cooldown
  useEffect(() => {
    try {
      console.log(`🔄 Cooldown debug for ${position.strategy}:`, {
        mostRecentDeposit: mostRecentDeposit?.created_at,
        positionUpdatedAt: position.updatedAt,
        lastDepositTime: new Date(lastDepositTime).toISOString(),
        timeSinceDeposit: Math.floor(timeSinceDeposit / 1000) + 's',
        cooldownRemaining: Math.floor(cooldownRemaining / 1000) + 's',
        isInCooldown
      });
    } catch (error) {
      console.log(`🔄 Cooldown debug for ${position.strategy}:`, {
        error: 'Date formatting error',
        lastDepositTime,
        isInCooldown
      });
    }
  }, [position.strategy, mostRecentDeposit, position.updatedAt, lastDepositTime, timeSinceDeposit, cooldownRemaining, isInCooldown]);

  const handleRedeem = async () => {
    // Don't allow redeem during cooldown or wrong chain
    if (isInCooldown || chainId !== position.chainId) {
      return;
    }

    try {
      const strategy = getStrategy(position.strategy, position.chainId);
      const token = getTokenByName(position.tokenName);

      console.log('🔄 Redeem attempt (post-cooldown):', {
        positionId: position.id,
        strategy: position.strategy,
        chainId: position.chainId,
        amount: position.amount,
        cooldownPassed: !isInCooldown
      });

      redeem.mutate(
        {
          strategy,
          amount: parseUnits(position.amount.toString(), token.decimals),
          token,
          positionId: position.id,
        },
        {
          onSuccess: (txHash) => {
            toast.success(`Redeem successful: ${txHash}`);
          },
          onError: (error) => {
            console.error('Redeem error (unexpected after cooldown):', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(`Redeem failed: ${errorMessage}`);
          },
        }
      );
    } catch (error) {
      console.error('Redeem setup error:', error);
      toast.error('Redeem failed: Setup error');
    }
  };

  const handleInvest = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <tr
        key={`${position.strategy}-${position.tokenName}-${index}`}
        className="bg-white rounded-xl shadow-[0_0_0_0.2px_#3d84ff,_0px_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1.5px_#3d84ff,_0px_4px_12px_rgba(0,0,0,0.15)] transition-all"
      >
        {/* Strategy */}
        <td className="p-4 rounded-l-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <Image
                src={`${strategyMetadata.protocol.icon}`}
                alt={position.strategy}
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <div className="font-bold">{strategyMetadata.title}</div>
            </div>
          </div>
        </td>

        {/* Asset */}
        <td className="p-4">
          <div className="flex items-center gap-3 justify-end">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <Image
                src={`${token.icon}`}
                alt={token.icon}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-end text-left min-w-[70px]">
              <div className="font-bold">{token.name}</div>
              {/* No symbol <div className="text-sm text-gray-500">{1234567}</div> */}
            </div>
          </div>
        </td>

        {/* Amount */}
        <td className="p-4 text-right">
          <div className="font-medium text-md">
            {Number(position.amount).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {`$ ${formatAmount(position.amount * price)}`}
          </div>
        </td>

        {/* Chain */}
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Image
              src={`/crypto-icons/chains/${position.chainId}.svg`}
              alt={`Chain ${position.chainId}`}
              width={20}
              height={20}
              className="object-contain"
            />
            <div className="text-sm font-medium text-gray-700">
              {getChain(position.chainId)?.name || 'Unknown'}
            </div>
          </div>
        </td>

        {/* Profit */}
        <td className="p-4 text-right">
          <div className="font-medium text-md text-green-500  ">
            {formatAmount(profit)}
          </div>
        </td>

        {/* Actions */}
        <td className="p-4 text-right rounded-r-xl">
          <div className="flex justify-end gap-1">
            {/* Show network warning if user is on wrong chain */}
            {chainId !== position.chainId && (
              <div className="mr-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md">
                Switch to {getChain(position.chainId)?.name}
              </div>
            )}
            
            <button
              onClick={handleInvest}
              className="px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-gray-50 transition-colors"
            >
              {invest.isPending ? "Investing..." : "Invest"}
            </button>

            <button
              onClick={handleRedeem}
              disabled={chainId !== position.chainId || isInCooldown}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                chainId !== position.chainId || isInCooldown
                  ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                  : 'text-primary hover:bg-gray-50'
              }`}
              title={
                chainId !== position.chainId 
                  ? `Switch to ${getChain(position.chainId)?.name} to redeem`
                  : isInCooldown 
                    ? `Redeem available in ${formatCooldownTime(cooldownRemaining)}`
                    : 'Redeem your position'
              }
            >
              {redeem.isPending ? "Redeeming..." : 
               isInCooldown ? `${formatCooldownTime(cooldownRemaining)}` : 
               "Redeem"}
            </button>
          </div>
        </td>
      </tr>

      {/* Use Portal to render Modal outside of table structure */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <InvestModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            strategy={strategyMetadata as StrategyMetadata}
          />,
          document.body
        )}
    </>
  );
}
