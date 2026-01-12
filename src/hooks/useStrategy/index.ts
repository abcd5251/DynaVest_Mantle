import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useMemo } from "react";
import { useChainId, useClient } from "wagmi";
import axios from "axios";
import { formatUnits, type Address } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useMutation } from "@tanstack/react-query";

import { BaseStrategy } from "@/classes/strategies/baseStrategy";
import { Protocol, Strategy } from "@/types/strategies";
import { MultiStrategy } from "@/classes/strategies/multiStrategy";
import { Token } from "@/types/blockchain";
import { StrategyCall } from "@/classes/strategies/baseStrategy";
import { queryClient } from "@/providers";
import { useTransaction } from "@/components/Profile/TransactionsTable/useTransaction";
import {
  getRedeemCalls,
  getInvestCalls,
  updatePosition,
  type PositionParams,
} from "./utils";
import { addFeesCall, calculateFee } from "@/utils/fee";
import { getTokenAddress, getTokenByName } from "@/utils/coins";
import { getStrategy } from "@/utils/strategies";

type RedeemParams = {
  strategy: BaseStrategy<Protocol>;
  amount: bigint;
  token: Token;
  positionId: string;
};

type InvestParams = {
  strategyId: Strategy;
  amount: bigint;
  token: Token;
};

type MultiInvestParams = {
  multiStrategy: MultiStrategy;
  amount: bigint;
  token: Token;
  positionId?: string;
};

export function useStrategy() {
  const { client } = useSmartWallets();
  const chainId = useChainId();
  const publicClient = useClient();
  const { addTx } = useTransaction();

  const user = useMemo(() => {
    return client?.account?.address || null;
  }, [client?.account?.address]);

  async function updatePositions(
    txHash: string,
    multiStrategy: MultiStrategy,
    amount: bigint,
    chainId: number,
    user: Address,
    tokenName: string = "USDC"
  ) {
    for (const singleStrategy of multiStrategy.strategies) {
      const token = getTokenByName(tokenName);

      const splitAmount = Number(
        formatUnits(
          (amount * BigInt(singleStrategy.allocation)) / BigInt(100),
          token.decimals
        )
      );

      const position: PositionParams = {
        address: user,
        amount: splitAmount,
        token_name: tokenName,
        chain_id: chainId,
        strategy: singleStrategy.strategy.name,
      };

      await updatePosition(position);
      await addTx.mutateAsync({
        address: user,
        chain_id: chainId,
        strategy: singleStrategy.strategy.name,
        hash: txHash,
        amount: splitAmount,
        token_name: tokenName,
        transaction_type: "deposit",
      });
    }
  }

  async function sendAndWaitTransaction(calls: StrategyCall[], targetChainId?: number) {
    async function waitForUserOp(userOp: `0x${string}`): Promise<string> {
      if (!publicClient) throw new Error("Public client not available");

      const { transactionHash, status } = await waitForTransactionReceipt(
        publicClient,
        {
          hash: userOp,
        }
      );

      if (status === "success") {
        return transactionHash;
      } else {
        throw new Error(
          `Strategy execution reverted with txHash: ${transactionHash}`
        );
      }
    }

    if (!client) throw new Error("Client not available");

    // Only switch chain if targetChainId is provided and different from current
    const switchChainId = targetChainId || chainId;
    if (switchChainId !== chainId) {
      try {
        await client.switchChain({ id: switchChainId });
      } catch (error) {
        console.error('Chain switch failed:', error);
        throw new Error(
          `Unable to switch to required chain ${switchChainId}. Please make sure the chain is configured in your wallet.`
        );
      }
    }
    
    const userOp = await client.sendTransaction(
      {
        calls,
      },
      {
        uiOptions: {
          showWalletUIs: false,
        },
      }
    );
    const txHash = await waitForUserOp(userOp);
    return txHash;
  }

  const redeem = useMutation({
    mutationFn: async ({
      strategy,
      amount,
      token,
      positionId,
    }: RedeemParams) => {
      if (!user) throw new Error("Smart wallet account not found");

      const { fee, amount: amountWithoutFee } = calculateFee(amount);
      const calls = await getRedeemCalls(
        strategy,
        amountWithoutFee,
        user,
        token,
        chainId
      );

      const feeCall = addFeesCall(
        getTokenAddress(token, strategy.chainId),
        token.isNativeToken,
        fee
      );
      console.log('💰 Fee call debug:', { tokenName: token.name, strategyChainId: strategy.chainId, feeCall });
      
      // Only add fee call if fee > 0
      if (fee > BigInt(0)) {
        calls.push(feeCall);
      }

      const txHash = await sendAndWaitTransaction(calls, strategy.chainId);

      // Update the status of position
      await axios.patch(
        `${process.env.NEXT_PUBLIC_CHATBOT_URL}/positions/${positionId}`,
        {
          status: "false",
        }
      );

      await addTx.mutateAsync({
        address: user,
        chain_id: strategy.chainId,
        strategy: strategy.name,
        hash: txHash,
        amount: Number(formatUnits(amountWithoutFee, token.decimals)),
        token_name: token.name,
        transaction_type: "withdraw",
      });

      return txHash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", user] });
    },
  });

  const invest = useMutation({
    mutationFn: async ({ strategyId, amount, token }: InvestParams) => {
      console.log('🚀 Investment started:', { strategyId, amount: amount.toString(), tokenName: token.name });
      
      try {
        if (!user) throw new Error("Smart wallet account not found");

        const strategy = getStrategy(strategyId, chainId);
        console.log('🚀 Strategy DEBUG:', {
          strategyId,
          userChainId: chainId,
          strategyChainId: strategy.chainId,
          strategyName: strategy.name
        });

        // All strategies operate on Base network - no bridging required
        console.log('🔗 Direct investment on Base network');

        const { fee, amount: amountWithoutFee } = calculateFee(amount);
        console.log('💰 Fee calculation:', { originalAmount: amount.toString(), fee: fee.toString(), amountWithoutFee: amountWithoutFee.toString() });
        
        // Standard investment flow for all Base strategies
        const calls = await getInvestCalls(
          strategy,
          amountWithoutFee,
          user,
          token,
          strategy.chainId
        );
        console.log('📋 Investment calls generated:', calls);

        // For fee call, use strategy's chain (all strategies on Base)
        const feeChainId = strategy.chainId;
        
        // Skip fee for testing
        const feeCall = addFeesCall(
          getTokenAddress(token, feeChainId),
          token.isNativeToken,
          fee
        );
        console.log('💰 Fee call created:', { 
          feeCall, 
          feeChainId,
          tokenName: token.name 
        });
        
        // Only add fee call if fee > 0
        if (fee > BigInt(0)) {
          calls.push(feeCall);
        }
        console.log('📋 All calls (including fee):', calls);
        
        console.log('🔗 Attempting to send transaction...');
        // Execute transaction on strategy chain (Base)
        const txHash = await sendAndWaitTransaction(calls, strategy.chainId);
        console.log('✅ Transaction sent successfully:', txHash);

        // For position tracking, use strategy's chainId for consistency
        await updatePosition({
          address: user,
          amount: Number(formatUnits(amountWithoutFee, token.decimals)),
          token_name: token.name,
          chain_id: strategy.chainId,
          strategy: strategy.name,
        });

        await addTx.mutateAsync({
          address: user,
          chain_id: strategy.chainId,
          strategy: strategy.name,
          hash: txHash,
          amount: Number(formatUnits(amountWithoutFee, token.decimals)),
          token_name: token.name,
          transaction_type: "deposit",
        });

        console.log('✅ Investment completed successfully!');
        return txHash;
      } catch (error) {
        console.error('❌ Investment failed:', error);
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", user] });
    },
  });

  const multiInvest = useMutation({
    mutationFn: async ({ multiStrategy, amount, token }: MultiInvestParams) => {
      if (!user) throw new Error("Smart wallet account not found");

      const { fee, amount: amountWithoutFee } = calculateFee(amount);
      const calls = await getInvestCalls(
        multiStrategy,
        amountWithoutFee,
        user,
        token,
        chainId
      );

      const feeCall = addFeesCall(
        getTokenAddress(token, chainId),
        token.isNativeToken,
        fee
      );
      
      // Only add fee call if fee > 0
      if (fee > BigInt(0)) {
        calls.push(feeCall);
      }

      const txHash = await sendAndWaitTransaction(calls, chainId);

      await updatePositions(
        txHash,
        multiStrategy,
        amountWithoutFee,
        chainId,
        user,
        token.name
      );

      return txHash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", user] });
    },
  });

  return {
    invest,
    multiInvest,
    redeem,
  };
}
