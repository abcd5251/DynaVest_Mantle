import { useEffect, useState } from "react";

import { BOT_STRATEGY } from "@/constants/strategies";
import type { StrategyMetadata } from "@/types";
import InvestmentForm from "@/components/StrategyList/StrategyCard/InvestModal/InvestmentForm";
import { InvestMessage } from "@/classes/message";

import type { Message } from "@/classes/message";
interface InvestmentFormChatWrapperProps {
  message: InvestMessage;
  addBotMessage: (message: Message) => Promise<void>;
}

const InvestmentFormChatWrapper = ({
  message,
  addBotMessage,
}: InvestmentFormChatWrapperProps) => {
  const [botStrategy, setBotStrategy] =
    useState<StrategyMetadata>(BOT_STRATEGY);

  const chain = message.chain; // Fixed to Base network

  useEffect(() => {
    setBotStrategy({
      ...BOT_STRATEGY,
      chainId: chain,
    });
  }, [chain]);

  const handlePortfolio = async (amount: string) => {
    message.amount = amount;
    // Chain is already set to Base by default
    const nextMessage = await message.next();
    await addBotMessage(nextMessage);
  };

  return (
    <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-gray-300 w-[80%]">
      <div className="flex items-center gap-2">
        <p className="font-[Manrope] font-medium text-sm text-gray-600">
          Cross-chain portfolio on Base network
        </p>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600 font-medium">Base (Live)</span>
        </div>
      </div>
      <InvestmentForm
        strategy={botStrategy}
        chat={{ handlePortfolio }}
      />
    </div>
  );
};

export default InvestmentFormChatWrapper;
