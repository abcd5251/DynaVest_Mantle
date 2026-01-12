import React from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Protocol } from "@/types/strategies";
import { PROTOCOLS, COMING_SOON_PROTOCOLS } from "@/constants/protocols";

export interface ProtocolFilterProps {
  protocols: Protocol[];
  selectedProtocols: Protocol[];
  setSelectedProtocols: (protocols: Protocol[]) => void;
  toggleProtocolSelection: (protocol: Protocol) => void;
  showProtocolDropdown: boolean;
  setShowProtocolDropdown: (value: boolean) => void;
  dropdownRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ProtocolFilter({
  protocols,
  selectedProtocols,
  setSelectedProtocols,
  toggleProtocolSelection,
  showProtocolDropdown,
  setShowProtocolDropdown,
}: ProtocolFilterProps) {
  const handleClear = () => {
    setSelectedProtocols([]);
  };

  const isProtocolActive = (protocol: Protocol) => {
    return PROTOCOLS.some(p => p.name === protocol.name);
  };

  const activeProtocols = protocols.filter(p => isProtocolActive(p));
  const comingSoonProtocols = protocols.filter(p => !isProtocolActive(p));

  return (
    <DropdownMenu
      open={showProtocolDropdown}
      onOpenChange={setShowProtocolDropdown}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 ${
            selectedProtocols.length > 0 ? "bg-[#E2E8F7]" : "bg-[#F8F9FE]"
          } rounded-lg border border-[#E2E8F7] hover:bg-[#E2E8F7] transition-colors`}
        >
          <span className="font-[family-name:var(--font-inter)] font-medium text-sm text-[#121212]">
            {selectedProtocols.length > 0
              ? `Protocol (${selectedProtocols.length})`
              : "Protocol"}
          </span>
          <Image
            src="/caret-down.svg"
            alt="Caret down"
            width={16}
            height={16}
            className={`transition-transform ${
              showProtocolDropdown ? "rotate-180" : ""
            }`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="p-3 pb-0">
          <div className="mb-2 font-medium text-sm text-gray-700">
            Filter by Protocol
          </div>
        </div>
        
        <div className="max-h-60 overflow-y-auto px-1">
          {/* Active Protocols */}
          {activeProtocols.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-green-600 font-semibold px-2 py-1">
                🟢 Live on Base
              </DropdownMenuLabel>
              {activeProtocols.map((protocol) => (
                <DropdownMenuCheckboxItem
                  key={protocol.name}
                  className="cursor-pointer"
                  checked={selectedProtocols.some((p) => p.name === protocol.name)}
                  onCheckedChange={() => toggleProtocolSelection(protocol)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    <span>{protocol.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}

          {/* Coming Soon Protocols */}
          {comingSoonProtocols.length > 0 && (
            <>
              {activeProtocols.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-orange-600 font-semibold px-2 py-1">
                🟠 Coming Soon
              </DropdownMenuLabel>
              {comingSoonProtocols.map((protocol) => (
                <DropdownMenuCheckboxItem
                  key={protocol.name}
                  className="cursor-not-allowed opacity-60"
                  checked={false}
                  disabled
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    <span>{protocol.name}</span>
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="flex justify-between items-center p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={handleClear}
          >
            Clear all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#5F79F1] font-medium hover:text-[#4A64DC]"
            onClick={() => setShowProtocolDropdown(false)}
          >
            Apply
          </Button>
        </div>
        
        {/* Info footer */}
        <div className="px-3 py-2 text-xs text-gray-500 border-t">
          Currently supporting Base network protocols only
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
