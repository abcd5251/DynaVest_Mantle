import axios from "axios";

import {
  COINGECKO_IDS,
  getTokenAddress,
  getTokenNameByCoingeckoId,
  isCoingeckoId,
} from "@/utils/coins";
import { Token } from "@/types";
import { base } from "viem/chains";
import { Address } from "viem";
import { getBalance } from "@wagmi/core";
import { wagmiConfig as config } from "@/providers/config";

type TokenPriceResponse = {
  [key: string]: {
    usd: number;
  };
};

export async function fetchTokenBalance(
  token: Token,
  user: Address,
  chainId: number = base.id
) {
  try {
    const tokenAddr = getTokenAddress(token, chainId);
    const params = {
      address: user,
      ...(token.isNativeToken ? {} : { token: tokenAddr }),
    };

    const balance = await getBalance(config, params);
    return balance;
  } catch (error) {
    console.warn(`Failed to fetch balance for ${token.name}:`, error);
    // Return zero balance if fetch fails
    return {
      decimals: token.decimals || 18,
      formatted: "0",
      symbol: token.symbol || token.name,
      value: 0n,
    };
  }
}

export async function fetchTokensPrices(tokens: Token[]) {
  try {
    const ids: string[] = [];
    for (const t of tokens) {
      if (!isCoingeckoId(t.name)) {
        console.warn(`Token ${t.name} is not supported by Coingecko`);
        continue;
      }
      ids.push(COINGECKO_IDS[t.name]);
    }

    if (ids.length === 0) {
      console.warn("No valid tokens for price fetching");
      return {};
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: ids.join(","),
          vs_currencies: "usd",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const prices = response.data as TokenPriceResponse;

    const res = Object.entries(prices).reduce((acc, [id, price]) => {
      const tokenName = getTokenNameByCoingeckoId(id);
      if (tokenName) {
        acc[tokenName] = price.usd;
      }
      return acc;
    }, {} as Record<string, number>);

    return res;
  } catch (error) {
    console.warn("Failed to fetch token prices from CoinGecko:", error);
    // Return empty object if price fetching fails
    return {};
  }
}
