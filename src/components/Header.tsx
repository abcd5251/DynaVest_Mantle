"use client";

import Link from "next/link";
import ConnectWalletButton from "./ConnectWalletButton";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ACTIVE_STRATEGIES } from "@/constants/strategies";

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

const navItems: NavItem[] = [
  { label: "Bot", href: "/", isActive: true },
  { label: "Strategies", href: "/strategies", isActive: true },
  { label: "News", href: "/news" },
  { label: "Stake", href: "/stake" },
  { label: "Bridge", href: "/bridge" },
  // { label: "Quests", href: "/quests" },
];

export default function Header() {
  const pathname = usePathname();

  // Get the actual count of active strategies
  const activeStrategiesCount = ACTIVE_STRATEGIES.length;

  return (
    <>
      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-5 md:px-20">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Live on Base Network</span>
            <span className="text-blue-200">•</span>
            <span className="text-blue-200">
              {activeStrategiesCount} strategies available
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-blue-200">
            <span>Multi-chain support coming soon</span>
          </div>
        </div>
      </div>

      <header className="flex justify-between items-center px-5 md:px-20 py-6">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-[#5F79F1] text-[22px] font-[family-name:var(--font-lily-script)]"
          >
            <Image src="/logo.svg" alt="DynaVest" width={145} height={120} />
          </Link>
        </div>

        <nav className="hidden md:flex gap-7 items-center">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`font-[family-name:var(--font-dm-sans)] font-medium text-base ${
                pathname === item.href ? "text-[#374151]" : "text-[#9CA3AF]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ConnectWalletButton />
        </div>
      </header>
    </>
  );
}
