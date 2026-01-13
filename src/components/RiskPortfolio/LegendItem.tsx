import Image from "next/image";
import { getRiskColor } from "@/utils";
import type { RiskLevel } from "@/types";
import { getChain } from "@/constants/chains";

export const LegendItem = ({
  color,
  name,
  apy,
  risk,
  chainId,
}: {
  color: string;
  name: string;
  apy: string;
  risk: RiskLevel;
  chainId: number;
}) => {
  const chain = getChain(chainId);
  
  return (
    <div className="flex items-start p-1 gap-1">
      <div className="flex justify-center items-center pt-1">
        <div
          className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-white"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap gap-1 md:gap-2 items-center">
          <span className="text-[10px] md:text-xs text-[rgba(0,0,0,0.7)]">
            {name}
          </span>
          <span className="text-[10px] md:text-xs text-[rgba(0,0,0,0.7)]">
            {apy}
          </span>
          <span
            className="text-[10px] md:text-xs capitalize"
            style={{
              color: getRiskColor(risk).text,
            }}
          >
            {risk}
          </span>
        </div>
        {chain && (
          <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-md w-fit">
            <Image 
              src={chain.icon} 
              alt={chain.name} 
              width={12} 
              height={12} 
              className="rounded-full"
            />
            <span className="text-[10px] text-gray-600 font-medium">
              {chain.name.includes('Mantle') ? 'Mantle' : 'Base'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
