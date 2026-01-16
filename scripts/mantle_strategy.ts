import { 
  createWalletClient, 
  http, 
  parseUnits, 
  erc20Abi, 
  publicActions, 
  parseAbi, 
  Hex
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantle } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

let privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  console.error('Please set PRIVATE_KEY in your .env file');
  process.exit(1);
}

// Ensure 0x prefix
if (!privateKey.startsWith('0x')) {
  privateKey = `0x${privateKey}`;
}

const account = privateKeyToAccount(privateKey as Hex);

const client = createWalletClient({
  account,
  chain: mantle,
  transport: http(),
}).extend(publicActions);

// Configuration
const CONFIG = {
  // Tokens
  USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
  USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
  WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
  
  // Contracts
  AGNI_ROUTER: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
  LENDLE_MARKET: '0xecce86d3D3f1b33Fe34794708B7074CDe4aBe9d4', // The Isolated LendingPool address
  
  // Settings
  SLIPPAGE: 0.01, // 1%
};

// ABIs
const ROUTER_ABI = parseAbi([
  'struct ExactInputSingleParams { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 deadline; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }',
  'function exactInputSingle(ExactInputSingleParams params) external payable returns (uint256 amountOut)',
]);

// Aave V2/V3 compatible ABI (Lendle is based on Geist -> Aave V2)
const LENDLE_ABI = parseAbi([
  'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external'
]);

export async function runMantleStrategy(amountUSDC: string = "1") {
  console.log(`🚀 Starting Mantle Strategy Script with account: ${account.address}`);

  // Fetch initial nonce
  let nonce = await client.getTransactionCount({
    address: account.address,
    blockTag: 'pending'
  });
  console.log(`Initial Nonce: ${nonce}`);

  const txHashes: string[] = [];

  // 1. Check Balances
  const usdcBalance = await client.readContract({
    address: CONFIG.USDC as Hex,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });

  console.log(`💰 USDC Balance: ${Number(usdcBalance) / 1e6} USDC`);

  const parsedAmount = parseUnits(amountUSDC, 6);
  const requiredUsdc = parsedAmount; 
  
  if (usdcBalance < requiredUsdc) {
    console.error(`❌ Insufficient USDC balance. Need at least ${amountUSDC} USDC, found ${Number(usdcBalance) / 1e6}`);
    // For demo purposes, we might want to continue or throw? 
    // Throwing allows the API to report failure.
    throw new Error(`Insufficient USDC balance. Need ${amountUSDC}, found ${Number(usdcBalance) / 1e6}`);
  }

  // Check MNT Balance for depositing (Need 1 MNT + gas)
  const mntBalance = await client.getBalance({ address: account.address });
  const mntToDeposit = BigInt("1000000000000000000"); // 1 MNT fixed for now
  const gasBuffer = BigInt("500000000000000000"); // 0.5 MNT
  
  if (mntBalance < mntToDeposit + gasBuffer) {
      console.error(`❌ Insufficient MNT balance. Need at least 1.5 MNT (1 for deposit + gas), found ${Number(mntBalance) / 1e18}`);
      throw new Error(`Insufficient MNT balance`);
  }

  // 2. Define Swap Amounts (USDC for USDe)
  const amountToSwap = parsedAmount; 
  console.log(`🔄 Strategy: Swap ${Number(amountToSwap) / 1e6} USDC to USDe and Deposit ${Number(mntToDeposit) / 1e18} Native MNT`);

  // 3. Approve Router
  console.log('🔓 Approving Agni Router for USDC...');
  const approveTx = await client.writeContract({
    address: CONFIG.USDC as Hex,
    abi: erc20Abi,
    functionName: 'approve',
    args: [CONFIG.AGNI_ROUTER as Hex, amountToSwap],
    nonce: nonce++,
  });
  await client.waitForTransactionReceipt({ hash: approveTx });
  txHashes.push(approveTx);
  console.log('✅ Approved');

  // 4. Swap USDC -> USDe with Retry Logic for Fees
  console.log('🔄 Executing Swap: USDC -> USDe...');
  const feeTiers = [100, 500, 2500, 10000]; // 0.01%, 0.05%, 0.25%, 1%
  let swapSuccess = false;

  for (const fee of feeTiers) {
    try {
      console.log(`Trying swap with Fee Tier: ${fee}...`);
      const usdeSwapParams = {
        tokenIn: CONFIG.USDC as Hex,
        tokenOut: CONFIG.USDe as Hex,
        fee: fee,
        recipient: account.address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), // 20 mins
        amountIn: amountToSwap,
        amountOutMinimum: BigInt(0), 
        sqrtPriceLimitX96: BigInt(0),
      };

      const usdeSwapTx = await client.writeContract({
        address: CONFIG.AGNI_ROUTER as Hex,
        abi: ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [usdeSwapParams],
        nonce: nonce++,
      });
      await client.waitForTransactionReceipt({ hash: usdeSwapTx });
      txHashes.push(usdeSwapTx);
      console.log(`✅ Swap USDC -> USDe complete (Fee: ${fee})`);
      swapSuccess = true;
      break; 
    } catch (e) {
      console.warn(`⚠️ Swap failed with fee ${fee}.`);
      // Re-fetch nonce to ensure we have the correct one for the next attempt
      nonce = await client.getTransactionCount({
        address: account.address,
        blockTag: 'pending'
      });
    }
  }

  if (!swapSuccess) {
    console.error('❌ All swap attempts failed. Aborting strategy.');
    throw new Error('Swap failed');
  }

  // 5. Deposit USDe into Lendle Isolated Market
  const usdeBalance = await client.readContract({
    address: CONFIG.USDe as Hex,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });

  if (usdeBalance > BigInt(0)) {
    console.log(`🏦 Depositing ${Number(usdeBalance) / 1e18} USDe into Lendle...`);
    
    // Approve Lendle
    const approveLendleTx = await client.writeContract({
      address: CONFIG.USDe as Hex,
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONFIG.LENDLE_MARKET as Hex, usdeBalance],
      nonce: nonce++,
    });
    await client.waitForTransactionReceipt({ hash: approveLendleTx });
    txHashes.push(approveLendleTx);
    console.log('✅ Approved USDe for Lendle');

    // Deposit
    try {
      const depositTx = await client.writeContract({
        address: CONFIG.LENDLE_MARKET as Hex,
        abi: LENDLE_ABI,
        functionName: 'deposit',
        args: [CONFIG.USDe as Hex, usdeBalance, account.address, 0],
        nonce: nonce++,
      });
      await client.waitForTransactionReceipt({ hash: depositTx });
      txHashes.push(depositTx);
      console.log('✅ Deposit USDe successful');
    } catch (e) {
      console.warn('⚠️ deposit() failed, trying supply()...');
      nonce--; // Reset nonce for fallback
      try {
        const supplyTx = await client.writeContract({
            address: CONFIG.LENDLE_MARKET as Hex,
            abi: LENDLE_ABI,
            functionName: 'supply',
            args: [CONFIG.USDe as Hex, usdeBalance, account.address, 0],
            nonce: nonce++,
          });
          await client.waitForTransactionReceipt({ hash: supplyTx });
          txHashes.push(supplyTx);
          console.log('✅ Supply USDe successful');
      } catch (error) {
        nonce--; // Reset nonce if failed
        console.error('❌ Failed to deposit/supply USDe:', error);
        throw error;
      }
    }
  }

  // 6. Deposit Native MNT into Lendle Isolated Market (via Wrap + Deposit)
  // Note: depositETH via Gateway failed due to allowance issues with Isolated Pools.
  // Fallback to robust Manual Wrap -> Approve -> Deposit flow.
  console.log(`🏦 Depositing ${Number(mntToDeposit) / 1e18} Native MNT (via WMNT) into Lendle...`);
  
  try {
    // 6a. Wrap MNT -> WMNT
    console.log('🔄 Wrapping MNT to WMNT...');
    const wrapTx = await client.sendTransaction({
      to: CONFIG.WMNT as Hex,
      value: mntToDeposit,
      nonce: nonce++,
    });
    await client.waitForTransactionReceipt({ hash: wrapTx });
    txHashes.push(wrapTx);
    console.log('✅ Wrapped MNT to WMNT');

    // 6b. Approve WMNT for Lendle
    console.log('🔓 Approving WMNT for Lendle...');
    const approveWmntTx = await client.writeContract({
      address: CONFIG.WMNT as Hex,
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONFIG.LENDLE_MARKET as Hex, mntToDeposit],
      nonce: nonce++,
    });
    await client.waitForTransactionReceipt({ hash: approveWmntTx });
    txHashes.push(approveWmntTx);
    console.log('✅ Approved WMNT for Lendle');

    // 6c. Deposit WMNT
    console.log('🏦 Depositing WMNT...');
    const depositWmntTx = await client.writeContract({
      address: CONFIG.LENDLE_MARKET as Hex,
      abi: LENDLE_ABI,
      functionName: 'deposit',
      args: [CONFIG.WMNT as Hex, mntToDeposit, account.address, 0],
      nonce: nonce++,
    });
    await client.waitForTransactionReceipt({ hash: depositWmntTx });
    txHashes.push(depositWmntTx);
    console.log('✅ Deposit WMNT successful');

  } catch (error) {
     console.warn('⚠️ WMNT deposit() failed, trying supply()...');
     nonce--; // Reset nonce for fallback (assuming failure was in last writeContract)
     try {
       const supplyTx = await client.writeContract({
           address: CONFIG.LENDLE_MARKET as Hex,
           abi: LENDLE_ABI,
           functionName: 'supply',
           args: [CONFIG.WMNT as Hex, mntToDeposit, account.address, 0],
           nonce: nonce++,
       });
       await client.waitForTransactionReceipt({ hash: supplyTx });
       txHashes.push(supplyTx);
       console.log('✅ Supply WMNT successful');
     } catch (err) {
         nonce--; // Reset nonce if failed
         console.error('❌ Failed to deposit/supply WMNT:', err);
         throw err;
     }
  }

  console.log('🎉 Strategy Execution Finished!');
  return { success: true, txHashes };
}

if (require.main === module) {
  runMantleStrategy().catch((error) => {
    console.error(error);
  });
}
