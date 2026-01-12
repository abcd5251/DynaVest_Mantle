import Image from "next/image";
import Link from "next/link";
import { base, mainnet, celo, bsc, polygon, arbitrum, flowMainnet, mantle } from "viem/chains";

import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/Tooltip";
import { DynamicChainDisplayWithTooltip } from "@/components/DynamicChainDisplay";
import { getDynamicRiskLevel } from "@/utils/dynamicRisk";
import { useStrategyLiveData } from "@/services/strategyDataService";

import InvestModal from "./InvestModal";
import { getRiskColor } from "@/utils";
import { useChat } from "@/contexts/ChatContext";
import type { Message, RiskLevel, StrategyMetadata } from "@/types";

function getRiskLevelLabel(risk: RiskLevel) {
  switch (risk) {
    case "low":
      return "Low Risk";
    case "medium":
      return "Medium Risk";
    case "high":
      return "High Risk";
    default:
      return "Unknown";
  }
}

export default function StrategyCard(strategy: StrategyMetadata) {
  const { title, id, apy, description, tokens, chainId, protocol, status } =
    strategy;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get live data for this strategy
  const { data: liveData, loading: liveDataLoading } = useStrategyLiveData(id);
  
  // Use dynamic risk based on APY
  const dynamicRisk = getDynamicRiskLevel(strategy);

  // Use live data with fallback to hardcoded values
  const displayAPY = liveData?.apy ?? apy;
  const displayTVL = liveData?.tvl ?? Math.abs(
    title
      .split("")
      .reduce(
        (hash, char) => (hash << 5) - hash + char.charCodeAt(0),
        0
      ) % 100
  );
  const dataSource = liveData?.source ?? 'hardcoded';

  // Extract the base description without "Learn More" text
  const baseDescription = description.replace(/\s*Learn More\s*$/, "");

  const { openChat, setMessages } = useChat();
  const router = useRouter();

  // Check if strategy is coming soon
  // Allow Base, Ethereum, Celo, BSC, Polygon, Arbitrum, Flow, and Mantle as active networks
  const isComingSoon = status === 'coming_soon' || (chainId !== base.id && chainId !== mainnet.id && chainId !== celo.id && chainId !== bsc.id && chainId !== polygon.id && chainId !== arbitrum.id && chainId !== flowMainnet.id && chainId !== mantle.id);
  const isDisabled = isComingSoon;

  const handleCardClick = (e: MouseEvent) => {
    // Don't navigate if clicking on a link or button, or if disabled
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="button"]') || isDisabled) {
      e.stopPropagation();
      return;
    }
    router.push(`/strategies/${id}`);
  };

  const handleBotClick = async () => {
    if (isDisabled) return;

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: `${strategy.title} intro: \n\n${strategy.fullDescription} \n\nDo you have any questions about this DeFi strategy?`,
      sender: "bot",
      timestamp: new Date(),
      type: "Text",
    };
    setMessages((prev) => [...prev, botMessage]);

    openChat();
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case base.id: return "Base";
      case mainnet.id: return "Ethereum";
      case 42161: return "Arbitrum";
      case 56: return "BSC";
      case 137: return "Polygon";
      case 42220: return "Celo";
      case 545: return "Flow";
      case 5000: return "Mantle";
      default: return "Unknown";
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`tracking-wide flex flex-col items-center p-5 bg-white rounded-2xl shadow-[0px_21px_27px_-10px_rgba(71,114,234,0.65)] h-full relative transition-all duration-200 ${
          isDisabled 
            ? 'opacity-60 cursor-not-allowed grayscale-[50%]' 
            : 'cursor-pointer hover:bg-gray-100'
        }`}
      >
        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
              Coming Soon
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex justify-between md:justify-around items-center w-full">
          <div className="relative">
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled) setIsModalOpen(true);
              }}
            >
              <DynamicChainDisplayWithTooltip
                strategy={strategy}
                size={60}
                className="rounded-lg"
              />
            </div>
            {isComingSoon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
                <span className="text-white text-xs font-semibold">Soon</span>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-col justify-center gap-2.5 w-[224px]">
            <div className="flex gap-[3px] self-stretch">
              <h3 className={`text-[18px] font-semibold ${isDisabled ? 'text-gray-500' : 'text-[#17181C]'}`}>
                {title}
                {isComingSoon && chainId !== base.id && chainId !== celo.id && (
                  <span className="text-sm text-gray-400 block">
                    ({getChainName(chainId)})
                  </span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-medium text-base ${isDisabled ? 'text-gray-400' : 'text-[#17181C]'}`}>
                {isComingSoon ? 'APY TBA' : (
                  liveDataLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `APY ${displayAPY.toFixed(2)}%`
                  )
                )}
              </span>
              <div
                className="flex justify-center items-center px-2 py-1 rounded-lg"
                style={{ backgroundColor: isDisabled ? '#f3f4f6' : getRiskColor(dynamicRisk).bg }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: isDisabled ? '#9ca3af' : getRiskColor(dynamicRisk).text }}
                >
                  {getRiskLevelLabel(dynamicRisk)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Section - Flex Grow */}
        <div className="flex flex-col items-start self-stretch flex-grow">
          <div className="flex flex-col items-start gap-4 self-stretch my-4">
            <div className="flex items-center gap-2 self-stretch">
              <div className="grid grid-cols-12 gap-2 w-full">
                <div className="col-span-4 space-y-1">
                  <div className={`text-sm ${isDisabled ? 'text-gray-400' : ''}`}>Protocol</div>
                  <div className={`text-sm ${isDisabled ? 'text-gray-400' : ''}`}>TVL</div>
                  <div className={`text-sm ${isDisabled ? 'text-gray-400' : ''}`}>Tokens</div>
                </div>
                <div className="col-span-7 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium truncate ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                      {protocol.name}
                    </span>
                    {protocol.link && !isDisabled && (
                      <Link
                        href={protocol.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-[#3568E8] hover:underline"
                        aria-label="Open protocol in new tab"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.33333 9.33333H2.66667V2.66667H6V1.33333H2.66667C1.93333 1.33333 1.33333 1.93333 1.33333 2.66667V9.33333C1.33333 10.0667 1.93333 10.6667 2.66667 10.6667H9.33333C10.0667 10.6667 10.6667 10.0667 10.6667 9.33333V6H9.33333V9.33333ZM7.33333 1.33333V2.66667H9.02L4.12 7.56667L5.06667 8.51333L10 3.58V5.33333H11.3333V1.33333H7.33333Z"
                            fill="currentColor"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>

                  <p className={`text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                    {isComingSoon ? 'TBA' : (
                      liveDataLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${displayTVL.toFixed(0)}M`
                      )
                    )}
                  </p>

                  <div className={`text-sm flex items-center gap-1 ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                    {tokens.map((token) => (
                      <div key={token.name} className={`w-5 h-5 relative ${isDisabled ? 'opacity-50' : ''}`}>
                        <Image
                          src={token.icon}
                          alt={token.name}
                          className="object-contain"
                          fill
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 flex items-start">
                  <Tooltip protocol={protocol} description={baseDescription} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action button section - always stay at bottom */}
        <div className="w-full mt-auto flex items-center gap-5">
          <button
            className={`flex-1 flex justify-center items-center py-2 px-4 rounded-lg font-medium transition-colors ${
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#5F79F1] text-white hover:bg-[#4A64DC]'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) {
                setIsModalOpen(true);
              }
            }}
            disabled={isDisabled}
          >
            {isComingSoon ? 'Coming Soon' : 'Invest'}
          </button>
          <div className="flex justify-center" style={{ width: 30 }}>
            <button
              onClick={handleBotClick}
              className={`rounded-full transition-transform ${
                isDisabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:scale-130'
              }`}
              disabled={isDisabled}
            >
              <Image
                src="/bot-icon-blue.svg"
                alt="bot"
                width={30}
                height={30}
                className={isDisabled ? 'opacity-50' : ''}
              />
            </button>
          </div>
        </div>

        {/* Coming Soon Overlay Message */}
        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-2xl">
            <div className="text-center p-4">
              <div className="text-lg font-semibold text-gray-700 mb-2">
                {chainId !== base.id && chainId !== celo.id ? `${getChainName(chainId)} Support` : 'Protocol Integration'}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {chainId !== base.id && chainId !== celo.id
                  ? 'Multi-chain support coming soon'
                  : 'Protocol integration in development'
                }
              </div>
              <div className="text-xs text-gray-500">
                Currently available on Base and Celo networks
              </div>
            </div>
          </div>
        )}
      </div>

      {!isDisabled && (
        <InvestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          strategy={strategy}
        />
      )}
    </>
  );
}
