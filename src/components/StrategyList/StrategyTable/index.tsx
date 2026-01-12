// Component to render individual strategy row with live data
function StrategyRow({ strategy, index, isDisabled, dynamicRisk, isComingSoon, onInvest, onBotClick }: {
  strategy: StrategyMetadata;
  index: number;
  isDisabled: boolean;
  dynamicRisk: any;
  isComingSoon: boolean;
  onInvest: () => void;
  onBotClick: () => void;
}) {
  const { data: liveData, loading: liveDataLoading } = useStrategyLiveData(strategy.id);
  
  // Use live data with fallback to hardcoded values
  const displayAPY = liveData?.apy ?? strategy.apy;
  const dataSource = liveData?.source ?? 'hardcoded';

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case base.id: return "Base";
      case mainnet.id: return "Ethereum";
      case 42161: return "Arbitrum";
      case 56: return "BSC";
      case 137: return "Polygon";
      case 42220: return "Celo";
      case 545: return "Flow";
      default: return "Unknown";
    }
  };

  return (
    <tr 
      key={index} 
      className={`rounded-3xl transition-all ${
        isDisabled 
          ? 'opacity-60 bg-gray-50' 
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Title */}
      <td className="pr-2 py-4">
        <div className={`text-sm font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
          {strategy.title}
          {isComingSoon && strategy.chainId !== base.id && strategy.chainId !== celo.id && strategy.chainId !== bsc.id && strategy.chainId !== polygon.id && strategy.chainId !== arbitrum.id && (
            <span className="text-xs text-gray-400 block">
              ({getChainName(strategy.chainId)})
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="pr-2 py-4">
        {isComingSoon ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Coming Soon
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
            Live
          </span>
        )}
      </td>

      {/* Risk */}
      <td className="pr-2 py-4">
        <div
          className="inline-flex px-2 py-1 text-sm rounded-lg"
          style={{ 
            backgroundColor: isDisabled ? '#f3f4f6' : getRiskColor(dynamicRisk).bg 
          }}
        >
          <span
            className="font-medium capitalize"
            style={{ 
              color: isDisabled ? '#9ca3af' : getRiskColor(dynamicRisk).text 
            }}
          >
            {dynamicRisk}
          </span>
        </div>
      </td>

      {/* Chain */}
      <td className="pr-2 py-4">
        <div className={`${isDisabled ? 'opacity-50 grayscale' : ''}`}>
          <DynamicChainDisplayWithTooltip
            strategy={strategy}
            size={24}
            showChainName={true}
          />
        </div>
      </td>
      
      {/* Protocol */}
      <td className="pr-2 py-4">
        <div className="text-sm truncate">
          <div className="flex items-center gap-x-1 flex-wrap">
            <Image
              src={`${strategy.protocol.icon}`}
              alt={strategy.title}
              width={24}
              height={24}
              className={isDisabled ? 'grayscale opacity-50' : ''}
            />
            <p className={`ml-2 ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
              {strategy.protocol.name}
            </p>
            {strategy.externalLink && !isDisabled && (
              <Link
                href={strategy.protocol.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:underline text-[#5F79F1]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </td>
      
      {/* Type */}
      <td className="pr-2 py-4">
        <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
          Lending
        </span>
      </td>
      
      {/* APY - Now with live data */}
      <td className="pr-2 py-4">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-[#17181C]'}`}>
            {isComingSoon ? 'TBA' : (
              liveDataLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                `${displayAPY.toFixed(1)}%`
              )
            )}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="pr-2 py-4 text-sm font-medium">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#5F79F1] text-white hover:bg-[#4A64DC] cursor-pointer'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) {
                onInvest();
              }
            }}
            disabled={isDisabled}
          >
            {isComingSoon ? 'Coming Soon' : 'Invest'}
          </button>

          <button
            onClick={() => !isDisabled && onBotClick()}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#5F79F1] text-white hover:bg-[#4A64DC] cursor-pointer'
            }`}
            disabled={isDisabled}
          >
            Ask AI
          </button>
        </div>
      </td>
    </tr>
  );
}import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { base, mainnet, celo, bsc, polygon, arbitrum, flowMainnet } from "viem/chains";

import { getRiskColor } from "@/utils";
import { getDynamicRiskLevel } from "@/utils/dynamicRisk";
import { useChat } from "@/contexts/ChatContext";
import { useStrategyLiveData } from "@/services/strategyDataService";
import type { Message, StrategyMetadata } from "@/types";
import { getChain } from "@/constants/chains";
import { DynamicChainDisplayWithTooltip } from "@/components/DynamicChainDisplay";
import InvestModal from "@/components/StrategyList/StrategyCard/InvestModal";

interface StrategyTableProps {
  strategies: Array<StrategyMetadata>;
}

export default function StrategyTable({ strategies }: StrategyTableProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { openChat, setMessages } = useChat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyMetadata>(
    strategies[0]
  );

  // Sort by hardcoded APY values (each row will fetch its own live data for display)
  const sortedStrategies = [...strategies].sort((a, b) => {
    return sortOrder === "asc" ? a.apy - b.apy : b.apy - a.apy;
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleBotClick = async (strategy: StrategyMetadata) => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: `${strategy.fullDescription}`,
      sender: "bot",
      timestamp: new Date(),
      type: "Text",
    };

    setMessages((prev) => [...prev, botMessage]);
    openChat();
  };

  // Check if strategy is coming soon
  // Allow Base, Ethereum, Celo, BSC, Polygon, Arbitrum, and Flow as active networks
  const isStrategyComingSoon = (strategy: StrategyMetadata) => {
    return strategy.status === 'coming_soon' || (strategy.chainId !== base.id && strategy.chainId !== mainnet.id && strategy.chainId !== celo.id && strategy.chainId !== bsc.id && strategy.chainId !== polygon.id && strategy.chainId !== arbitrum.id && strategy.chainId !== flowMainnet.id);
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
      default: return "Unknown";
    }
  };

  return (
    <div className="w-full">
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead>
          <tr>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[15%]"
            >
              Strategy
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[10%]"
            >
              Status
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[10%]"
            >
              Risk
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[15%]"
            >
              Chain
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[18%]"
            >
              Protocol
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[8%]"
            >
              Type
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[10%] cursor-pointer"
              onClick={toggleSortOrder}
            >
              <div className="flex items-center">
                APY
                <svg
                  className="ml-1 w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {sortOrder === "asc" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    ></path>
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 13l5 5m0 0l5-5m-5 5V6"
                    ></path>
                  )}
                </svg>
              </div>
            </th>
            <th
              scope="col"
              className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-[14%]"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedStrategies.map((strategy, index) => {
            const isComingSoon = isStrategyComingSoon(strategy);
            const isDisabled = isComingSoon;
            const dynamicRisk = getDynamicRiskLevel(strategy);
            
            return (
              <StrategyRow
                key={strategy.id}
                strategy={strategy}
                index={index}
                isDisabled={isDisabled}
                dynamicRisk={dynamicRisk}
                isComingSoon={isComingSoon}
                onInvest={() => {
                  setIsModalOpen(true);
                  setSelectedStrategy(strategy);
                }}
                onBotClick={() => handleBotClick(strategy)}
              />
            );
          })}
        </tbody>
      </table>
      
      {!isStrategyComingSoon(selectedStrategy) && (
        <InvestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          strategy={selectedStrategy}
        />
      )}
    </div>
  );
}
