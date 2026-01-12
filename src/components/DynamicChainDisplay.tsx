// components/DynamicChainDisplay.tsx
import Image from "next/image";
import { getChain } from "@/constants/chains";
import type { StrategyMetadata } from "@/types";

interface DynamicChainDisplayProps {
  strategy: StrategyMetadata;
  size?: number;
  showChainName?: boolean;
  className?: string;
}

/**
 * Get short chain name for display
 */
function getShortChainName(chainName: string): string {
  if (chainName === 'BNB Smart Chain') return 'BSC';
  if (chainName === 'Flow EVM Mainnet') return 'Flow';
  if (chainName === 'Arbitrum One') return 'Arbitrum';
  return chainName;
}

/**
 * Chain display component for DynaVest strategies
 * All current strategies operate on Base network
 */
export function DynamicChainDisplay({
  strategy,
  size = 24,
  showChainName = false,
  className = ""
}: DynamicChainDisplayProps) {
  const displayChain = getChain(strategy.chainId);

  if (!displayChain) {
    return null;
  }

  const shortName = getShortChainName(displayChain.name);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={displayChain.icon}
        alt={shortName}
        width={size}
        height={size}
        className="rounded-full"
      />
      {showChainName && (
        <span className="text-sm text-gray-600">{shortName}</span>
      )}
    </div>
  );
}

// Extended version with tooltip for better UX
interface DynamicChainDisplayWithTooltipProps extends DynamicChainDisplayProps {
  showTooltip?: boolean;
}

export function DynamicChainDisplayWithTooltip({
  strategy,
  showTooltip = true,
  ...props
}: DynamicChainDisplayWithTooltipProps) {
  const displayChain = getChain(strategy.chainId);
  const display = <DynamicChainDisplay strategy={strategy} {...props} />;

  if (showTooltip && displayChain) {
    const shortName = getShortChainName(displayChain.name);
    return (
      <div title={`Strategy operates on ${shortName}`} className="cursor-help">
        {display}
      </div>
    );
  }

  return display;
}
