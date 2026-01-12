"use client";

import { useState } from "react";
import Image from "next/image";
import { DYNA } from "@/constants/coins";
import useBalance from "@/hooks/useBalance";
import { formatUnits, parseUnits } from "viem";
import { formatAmount } from "@/utils";
import { MoonLoader } from "react-spinners";
import { useAssets } from "@/contexts/AssetsContext";

type StakeTab = "stake" | "unstake" | "withdraw";

export default function StakePage() {
  const [selectedTab, setSelectedTab] = useState<StakeTab>("stake");
  const [amount, setAmount] = useState<string>("");

  const { balance: dynaBalance = BigInt(0), isLoadingBalance } =
    useBalance(DYNA);
  const { pricesQuery } = useAssets();
  const { data: pricesData, isError } = pricesQuery;
  const price = isError ? 0 : pricesData?.[DYNA.name] || 0;

  const handleSetMax = () => {
    setAmount(formatUnits(dynaBalance, DYNA.decimals));
  };

  const handleStake = () => {
    if (!amount || Number(amount) <= 0) return;
    // TODO: Implement stake smart contract call
    const parsedAmount = parseUnits(amount, DYNA.decimals);
    console.log("Staking:", parsedAmount.toString(), "DYNA");
  };

  const handleUnstake = () => {
    if (!amount || Number(amount) <= 0) return;
    // TODO: Implement unstake smart contract call
    const parsedAmount = parseUnits(amount, DYNA.decimals);
    console.log("Unstaking:", parsedAmount.toString(), "DYNA");
  };

  const handleWithdraw = () => {
    // TODO: Implement withdraw rewards smart contract call
    console.log("Withdrawing rewards");
  };

  return (
    <div className="min-h-[80vh] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            👋 Stake $DYNA
          </h1>

          <div className="space-y-2 text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-lg">1.</span>
              <p className="text-sm sm:text-base">
                Potential $DYNA airdrop reward (Up to 7% total $DYNA)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">2.</span>
              <p className="text-sm sm:text-base">
                Access to latest twitter's alpha information
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">3.</span>
              <p className="text-sm sm:text-base">
                Track your target Twitter's account
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {(["stake", "unstake", "withdraw"] as StakeTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 font-semibold capitalize transition-colors relative ${
                  selectedTab === tab
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                {selectedTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Stake Form */}
          {selectedTab === "stake" && (
            <>
              <div className="mb-2 text-sm text-gray-500">Amount</div>

              {/* Amount Input */}
              <div className="bg-gray-100 rounded-md border border-gray-300 mb-4">
                <div className="flex items-center w-full gap-2">
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    className="flex-1 min-w-0 bg-transparent text-gray-500 block px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-0 focus:border-0 placeholder:text-gray-500"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                  />
                  <div className="shrink-0 flex items-center gap-2 px-4 py-2">
                    <Image
                      src={DYNA.icon}
                      alt={DYNA.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="font-semibold text-gray-700">
                      {DYNA.name}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col px-4 pb-2">
                  <div className="text-xs md:text-sm text-gray-500">
                    ≈ $ {Number((Number(amount || 0) * price).toFixed(4))}
                  </div>
                </div>
              </div>

              {/* Balance and Max Button */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
                  <span>Balance: </span>
                  <div>
                    {isLoadingBalance ? (
                      <MoonLoader size={10} />
                    ) : (
                      formatAmount(
                        Number(formatUnits(dynaBalance, DYNA.decimals)),
                        4
                      )
                    )}
                  </div>
                  <span>{DYNA.name}</span>
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  disabled={isLoadingBalance}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  MAX
                </button>
              </div>

              <button
                onClick={handleStake}
                disabled={!amount || Number(amount) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Stake DYNA
              </button>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Staked DYNA tokens will be locked and
                  earn rewards. You can unstake them anytime.
                </p>
              </div>
            </>
          )}

          {/* Unstake Form */}
          {selectedTab === "unstake" && (
            <>
              <div className="mb-2 text-sm text-gray-500">Amount</div>

              {/* Amount Input */}
              <div className="bg-gray-100 rounded-md border border-gray-300 mb-4">
                <div className="flex items-center w-full gap-2">
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    className="flex-1 min-w-0 bg-transparent text-gray-500 block px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-0 focus:border-0 placeholder:text-gray-500"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                  />
                  <div className="shrink-0 flex items-center gap-2 px-4 py-2">
                    <Image
                      src={DYNA.icon}
                      alt={DYNA.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="font-semibold text-gray-700">
                      {DYNA.name}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col px-4 pb-2">
                  <div className="text-xs md:text-sm text-gray-500">
                    ≈ $ {Number((Number(amount || 0) * price).toFixed(4))}
                  </div>
                </div>
              </div>

              {/* Balance and Max Button */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
                  <span>Staked Balance: </span>
                  <div>
                    {isLoadingBalance ? (
                      <MoonLoader size={10} />
                    ) : (
                      /* TODO: Show staked balance instead of wallet balance */
                      formatAmount(
                        Number(formatUnits(dynaBalance, DYNA.decimals)),
                        4
                      )
                    )}
                  </div>
                  <span>{DYNA.name}</span>
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  disabled={isLoadingBalance}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  MAX
                </button>
              </div>

              <button
                onClick={handleUnstake}
                disabled={!amount || Number(amount) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Unstake DYNA
              </button>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> Unstaking will remove your tokens
                  from the staking pool and stop earning rewards.
                </p>
              </div>
            </>
          )}

          {/* Withdraw Form */}
          {selectedTab === "withdraw" && (
            <>
              <button
                onClick={handleWithdraw}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Withdraw Rewards
              </button>
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  ✨ <strong>Rewards:</strong> Withdraw your accumulated staking
                  rewards without unstaking your principal.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
