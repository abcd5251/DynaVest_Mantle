import Image from "next/image";
import { Dispatch, Fragment, SetStateAction } from "react";
import { base, mainnet, celo, bsc, polygon, arbitrum, flowMainnet, mantle } from "viem/chains";

import { CHAINS } from "@/constants/chains";

interface ChainFilterProps {
  selectedChains: number[];
  setSelectedChains?: Dispatch<SetStateAction<number[]>>;
  setSelectedChain?: Dispatch<SetStateAction<number>>;
  className?: string;
  selectionMode?: "single" | "multiple";
}

export default function ChainFilter({
  selectedChains,
  setSelectedChains,
  setSelectedChain,
  className = "",
  selectionMode = "multiple",
}: ChainFilterProps) {
  
  const getChainStatus = (chainId: number) => {
    // Base, Celo, BSC, Polygon, Arbitrum, Flow, and Mantle are live
    return ( chainId === base.id ||  chainId === mantle.id || chainId === celo.id || chainId === bsc.id || chainId === polygon.id || chainId === arbitrum.id || chainId === flowMainnet.id) ? 'active' : 'coming_soon';
  };

  const getChainName = (chainId: number) => {
    const chain = CHAINS.find(c => c.id === chainId);
    const name = chain?.name || 'Unknown';
    // Use short names for better display
    return name === 'BNB Smart Chain' ? 'BSC' : name;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-1">Networks</div>
      <div
        className={`flex items-center gap-2 rounded-xl bg-[#F8F9FE] px-2 py-1`}
      >
        {CHAINS.map((chain, idx) => {
          const isActive = getChainStatus(chain.id) === 'active';
          const isSelected = selectedChains.includes(chain.id);
          
          return (
            <Fragment key={chain.id}>
              <div className="relative">
                <button
                  key={chain.id}
                  type="button"
                  className={`w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors relative
                    ${isActive ? 'cursor-pointer' : 'cursor-not-allowed'}
                    ${
                      selectedChains.length > 0
                        ? isSelected
                          ? "opacity-100"
                          : "opacity-50"
                        : "opacity-100"
                    }
                  `}
                  onClick={() => {
                    if (!isActive) return; // Don't allow selection of inactive chains
                    
                    if (selectionMode === "single") {
                      if (setSelectedChain) {
                        setSelectedChain(chain.id);
                      } else {
                        throw new Error("setSelectedChain is required");
                      }
                    } else {
                      if (setSelectedChains) {
                        setSelectedChains((prev) =>
                          prev.includes(chain.id)
                            ? prev.filter((id) => id !== chain.id)
                            : [...prev, chain.id]
                        );
                      } else {
                        throw new Error("setSelectedChains is required");
                      }
                    }
                  }}
                  aria-label={`${chain.name} ${isActive ? '(Active)' : '(Coming Soon)'}`}
                  title={`${chain.name} ${isActive ? '(Live)' : '(Coming Soon)'}`}
                >
                  <Image
                    src={chain.icon}
                    alt={chain.name}
                    width={12}
                    height={12}
                    className="w-6 h-6"
                  />
                  
                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                  
                  {/* Coming soon indicator */}
                  {!isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white"></div>
                  )}
                </button>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {getChainName(chain.id)} {isActive ? '(Live)' : '(Soon)'}
                </div>
              </div>
              
              {/* Divider */}
              {idx < CHAINS.length - 1 && (
                <span className="w-[1.5px] h-6 bg-gray-200 rounded-full mx-1" />
              )}
            </Fragment>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Live</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
