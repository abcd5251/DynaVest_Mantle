import React, { FC, useState, useEffect } from "react";
import { MoveUpRight } from "lucide-react";

import { RiskLevel } from "@/types";
import { RISK_OPTIONS } from "@/constants/risk";
import { FindStrategiesMessage, Message } from "@/classes/message";
import { RiskBadgeList } from "../../RiskBadgeList";
import Button from "../../Button";
import StrategyCard from "../../StrategyList/StrategyCard";
import { ACTIVE_STRATEGIES } from "@/constants/strategies";
import { getDynamicRiskLevel } from "@/utils/dynamicRisk";

interface FindStrategiesChatWrapperProps {
  message: FindStrategiesMessage;
  addBotMessage: (message: Message) => Promise<void>;
}

const FindStrategiesChatWrapper: FC<FindStrategiesChatWrapperProps> = ({
  message,
  addBotMessage,
}) => {
  const [chains] = useState<number[]>(message.chains); // Keep chains but don't show selection
  const [risk, setRisk] = useState<RiskLevel>(message.risk);
  const [isEdit, setIsEdit] = useState(true);
  const [filteredStrategies, setFilteredStrategies] = useState(ACTIVE_STRATEGIES);

  // Filter strategies based on selected risk level
  useEffect(() => {
    const filtered = ACTIVE_STRATEGIES.filter(strategy => {
      // If risk is one of the valid options, filter by dynamic risk level (same as StrategyCard uses)
      if (RISK_OPTIONS.includes(risk)) {
        const dynamicRisk = getDynamicRiskLevel(strategy);
        return dynamicRisk.toLowerCase() === risk.toLowerCase();
      }
      // Otherwise show all strategies
      return true;
    });
    setFilteredStrategies(filtered);
  }, [risk]);

  const nextMessage = async () => {
    message.chains = chains;
    message.risk = risk;

    setIsEdit(false);

    await addBotMessage(message.next());
  };

  const getRiskDisplayName = (riskLevel: RiskLevel | string) => {
    if (typeof riskLevel === 'string' && RISK_OPTIONS.includes(riskLevel as RiskLevel)) {
      return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
    }
    return "All Levels";
  };

  return (
    <div className="mt-4 flex flex-col gap-6">
      {/* Risk Selection */}
      <div className="flex items-center gap-2">
        <p className="font-[Manrope] font-medium text-sm">Select Risk</p>
        <RiskBadgeList
          selectedRisk={risk}
          setSelectedRiskLevel={setRisk}
          options={RISK_OPTIONS}
          isEditable={isEdit}
        />
      </div>
      
      {/* Strategy Cards - Show directly instead of requiring button click */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-[Manrope] font-medium text-sm text-gray-700">
            Available Strategies ({filteredStrategies.length})
          </p>
          {filteredStrategies.length > 0 && (
            <p className="font-[Manrope] font-medium text-xs text-gray-500">
              Risk Level: {getRiskDisplayName(risk)}
            </p>
          )}
        </div>
        
        {filteredStrategies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="font-[Manrope] font-medium text-sm">
              No strategies found for the selected risk level.
            </p>
            <p className="font-[Manrope] font-normal text-xs mt-1">
              Try selecting a different risk level to see available strategies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto">
            {filteredStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} {...strategy} />
            ))}
          </div>
        )}
      </div>

      {/* Keep the original button for backward compatibility, but make it less prominent */}
      {filteredStrategies.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="w-full max-w-[250px] mx-auto">
            <Button
              onClick={nextMessage}
              text={`View All ${filteredStrategies.length} Strategies`}
              disabled={!isEdit}
              icon={<MoveUpRight />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FindStrategiesChatWrapper;