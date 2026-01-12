import React from "react";
import { ArrowUpRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

import { useAssets } from "@/contexts/AssetsContext";

interface CreateAccountProps {
  handleMessage: (message: string) => void;
}

const CreateAccount = ({ handleMessage }: CreateAccountProps) => {
  const { authenticated } = usePrivy();
  const { login } = useAssets();

  const handleLogin = () => {
    if (!authenticated) {
      login();
    } else {
      handleMessage("Run a Cross-Chain, Multi-Protocols Yield Portfolio");
    }
    return;
  };

  const backgroundStyle = {
    background:
      "linear-gradient(-86.667deg, rgba(95, 121, 241, 30%) 18%, rgba(253, 164, 175, 30%) 100%)",
  };

  // If user is authenticated, show the Multi-Strategy button instead
  if (authenticated) {
    return (
      <button
        className="flex-1 bg-white border border-[rgba(95,121,241,0.4)] rounded-[11px] p-5 relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.15)] text-left flex flex-col gap-2"
        onClick={() =>
          handleMessage("Run a Cross-Chain, Multi-Protocols Yield Portfolio")
        }
      >
        <div
          style={backgroundStyle}
          className="bg-gradient-to-r rounded-[4px] px-2.5 py-1.5 self-start shadow-[0px_1px_4px_0px_rgba(0,0,0,0.15)]"
        >
          <span className="font-[Manrope] font-semibold text-xs text-black">
            Multi-Strategies
          </span>
        </div>
        <p className="font-[Manrope] font-semibold text-base text-black text-center">
          Run a Cross-Chain, Multi-Protocols <br />
          Yield Portfolio
        </p>
        <div className="flex items-center justify-between gap-1 mt-auto pt-2 px-[30px]">
          <Image
            src="/crypto-icons/chains/8453.svg"
            alt="Base"
            width={29}
            height={29}
          />
          <Image src="/crypto-icons/bnb.svg" alt="BNB" width={29} height={29} />
          <Image
            src="/crypto-icons/chains/42161.svg"
            alt="Arbitrum"
            width={29}
            height={29}
          />
          <Image
            src="/crypto-icons/chains/747.svg"
            alt="Flow"
            width={29}
            height={29}
          />
          <Image
            src="/crypto-icons/sonic.svg"
            alt="Sonic"
            width={29}
            height={29}
          />
          <Image
            src="/crypto-icons/chains/137.svg"
            alt="Polygon"
            width={29}
            height={29}
          />
        </div>
        <ArrowUpRight className="w-6 h-6 text-black absolute top-4 right-5" />
      </button>
    );
  }

  // If user is not authenticated, show the login button
  return (
    <div
      onClick={handleLogin}
      className="flex-1 rounded-[11px] px-[20px] py-[10px] relative border border-[#5F79F1] bg-white text-black cursor-pointer"
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <span className="font-[Manrope] font-semibold text-xs">Step 1</span>
          <span className="font-[Manrope] font-semibold text-base">
            Create Account or Login
          </span>
        </div>
        <div className="flex items-center justify-center text-black">
          <ArrowUpRight />
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
