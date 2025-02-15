import { ethers } from "ethers";
import { z } from "zod";
import Safe, { SigningMethod } from "@safe-global/protocol-kit";

const SUPERVAULT_ABI = [
  // Basic vault operations
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 shares) external",
  "function withdrawAll() external",
  "function totalAssets() public view returns (uint256)",
  
  // Pool operations
  "function depositToPool(string calldata poolName, uint256 amount) external",
  "function withdrawFromPool(string calldata poolName, uint256 amount) external",
  "function getPoolBalance(string calldata poolName, address asset) external view returns (uint256)",
  "function getPoolAddress(string calldata poolName) external view returns (address)",
  "function getPoolList() external view returns (string[] memory)",
  
  // Strategy operations
  "function allocateToStrategy(uint8 strategyType, uint256 amount) external",
  "function withdrawFromStrategy(uint8 strategyType, uint256 amount) external",
  "function getStrategyAddress(uint8 strategyType) external view returns (address)",
  "function balanceOf(address account) external view returns (uint256)",
  {
    "inputs": [],
    "name": "totalAssets",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Update to Avalanche mainnet
const SUPERVAULT_ADDRESS = "0x50109a09aA3Ff67Ae594802468328e16bf85eb64";
const AVALANCHE_RPC_URL = "https://api.avax.network/ext/bc/C/rpc";

// Basic vault operations
export const depositToVault = async ({ amount }: { amount: string }) => {
    const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC_URL);
    const contract = new ethers.Contract(SUPERVAULT_ADDRESS, SUPERVAULT_ABI, provider);

    const protocolKit = await Safe.init({ 
        provider: process.env.RPC_URL!,
        signer: process.env.AGENT_PRIVATE_KEY!,
        safeAddress: process.env.SAFE_ADDRESS!
      });

  const data = contract.interface.encodeFunctionData("deposit", [
    ethers.parseEther(amount)
  ]);

  const safeTransaction = await protocolKit.createTransaction({
    transactions: [{
      to: SUPERVAULT_ADDRESS,
      data,
      value: "0"
    }]
  });

  const txResponse = await protocolKit.executeTransaction(safeTransaction);
  const receipt = await (txResponse.transactionResponse as ethers.TransactionResponse).wait();
  console.log(receipt);
  return `Successfully deposited ${amount} tokens into SuperVault`;
};

// Pool operations
export const depositToPool = async ({ poolName, amount }: { poolName: string, amount: string }) => {
  try {
    console.log("Starting depositToPool...");
    
    const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC_URL);
    console.log("Provider initialized");

    // Add signer initialization
    const signer = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
    console.log("Initializing Safe with address:", process.env.SAFE_ADDRESS);
    
    // Simple Safe initialization since it's already deployed
    const protocolKit = await Safe.init({ 
      provider: AVALANCHE_RPC_URL,
      signer: process.env.AGENT_PRIVATE_KEY!,
      safeAddress: process.env.SAFE_ADDRESS!
    });
    console.log("Safe initialized");

    const contract = new ethers.Contract(SUPERVAULT_ADDRESS, SUPERVAULT_ABI);
    console.log("Contract instance created");

    // Send only 0.1 USDC as a test
    const testAmount = "0.1";
    const parsedAmount = ethers.parseUnits(testAmount, 6);
    console.log("Parsed test amount:", parsedAmount.toString());

    console.log("Creating Safe transaction...");
    let safeTransaction = await protocolKit.createTransaction({
      transactions: [{
        to: SUPERVAULT_ADDRESS,
        data: contract.interface.encodeFunctionData("depositToPool", [poolName, parsedAmount]),
        value: "0"
      }]
    });
    console.log("Safe transaction created");

    // Sign the transaction with ETHEREUM_SIGN method for Avalanche
    console.log("Signing transaction with ETHEREUM_SIGN...");
    safeTransaction = await protocolKit.signTransaction(
        safeTransaction,
        SigningMethod.ETH_SIGN_TYPED_DATA
    );
    console.log("Transaction signed");

    console.log("Executing transaction...");
    const txResponse = await protocolKit.executeTransaction(safeTransaction);
    console.log("Transaction response:", txResponse);
    
    const receipt = await (txResponse.transactionResponse as ethers.TransactionResponse).wait();
    console.log("Transaction receipt:", receipt);

    return `Successfully deposited ${testAmount} USDC into ${poolName} pool`;
  } catch (error) {
    console.error("Error in depositToPool:", error);
    throw error;
  }
};

export const withdrawFromPool = async ({ poolName, amount }: { poolName: string, amount: string }) => {
  
  const protocolKit = await Safe.init({ 
    provider: process.env.RPC_URL!,
    signer: process.env.AGENT_PRIVATE_KEY!,
    safeAddress: process.env.SAFE_ADDRESS!
  });

  const contract = new ethers.Contract(SUPERVAULT_ADDRESS, SUPERVAULT_ABI);
  const data = contract.interface.encodeFunctionData("withdrawFromPool", [
    poolName,
    ethers.parseEther(amount)
  ]);

  const safeTransaction = await protocolKit.createTransaction({
    transactions: [{
      to: SUPERVAULT_ADDRESS,
      data,
      value: "0"
    }]
  });

  const txResponse = await protocolKit.executeTransaction(safeTransaction);
  const receipt = await (txResponse.transactionResponse as ethers.TransactionResponse).wait();
  console.log(receipt);

  return `Successfully withdrawn ${amount} tokens from pool ${poolName}`;
};

// Strategy operations
export const allocateToStrategy = async ({ strategyType, amount }: { strategyType: number, amount: string }) => {

  const protocolKit = await Safe.init({ 
    provider: process.env.RPC_URL!,
    signer: process.env.AGENT_PRIVATE_KEY!,
    safeAddress: process.env.SAFE_ADDRESS!
  });

  const contract = new ethers.Contract(SUPERVAULT_ADDRESS, SUPERVAULT_ABI);
  const data = contract.interface.encodeFunctionData("allocateToStrategy", [
    strategyType,
    ethers.parseEther(amount)
  ]);

  const safeTransaction = await protocolKit.createTransaction({
    transactions: [{
      to: SUPERVAULT_ADDRESS,
      data,
      value: "0"
    }]
  });

  const txResponse = await protocolKit.executeTransaction(safeTransaction);
  const receipt = await (txResponse.transactionResponse as ethers.TransactionResponse).wait();
  console.log(receipt);
  return `Successfully allocated ${amount} tokens to strategy type ${strategyType}`;
};

// Tool metadata
export const depositToVaultMetadata = {
  name: "depositToVault",
  description: "Deposit tokens into the SuperVault contract",
  schema: z.object({
    amount: z.string().describe("Amount of tokens to deposit"),
  }),
};

export const depositToPoolMetadata = {
  name: "depositToPool",
  description: "Deposit tokens into a specific pool in SuperVault",
  schema: z.object({
    poolName: z.string().describe("Name of the pool to deposit to"),
    amount: z.string().describe("Amount of tokens to deposit"),
  }),
};

export const withdrawFromPoolMetadata = {
  name: "withdrawFromPool",
  description: "Withdraw tokens from a specific pool in SuperVault",
  schema: z.object({
    poolName: z.string().describe("Name of the pool to withdraw from"),
    amount: z.string().describe("Amount of tokens to withdraw"),
  }),
};

export const allocateToStrategyMetadata = {
  name: "allocateToStrategy",
  description: "Allocate funds to a specific strategy in SuperVault",
  schema: z.object({
    strategyType: z.number().describe("Type of strategy (0 for AAVE, 1 for BALANCER)"),
    amount: z.string().describe("Amount of tokens to allocate"),
  }),
};

export const getVaultBalance = async () => {
  try {
    console.log("Starting getVaultBalance...");
    const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC_URL);  // Using mainnet RPC
    console.log("Provider initialized");

    // Add debugging
    console.log("Checking contract at address:", SUPERVAULT_ADDRESS);
    console.log("Using RPC URL:", AVALANCHE_RPC_URL);
    
    const network = await provider.getNetwork();
    console.log("Connected to network:", {
      chainId: network.chainId,
      name: network.name
    });

    const code = await provider.getCode(SUPERVAULT_ADDRESS);
    console.log("Contract code:", code);
    console.log("Contract code length:", code.length);
    
    if (code === "0x") {
      throw new Error("No contract found at address");
    }

    const contract = new ethers.Contract(SUPERVAULT_ADDRESS, SUPERVAULT_ABI, provider);
    console.log("Contract instance created");

    const totalAssets = await contract.totalAssets();
    console.log("Total assets raw:", totalAssets.toString());
    const formattedTotal = ethers.formatUnits(totalAssets, 6);
    console.log("Formatted total:", formattedTotal);

    console.log("Fetching pool list...");
    const poolList = await contract.getPoolList();
    console.log("Pool list:", poolList);

    console.log("Fetching pool balances...");
    const poolBalances = await Promise.all(
      poolList.map(async (poolName: string) => {
        console.log(`Checking balance for pool: ${poolName}`);
        const balance = await contract.getPoolBalance(poolName, SUPERVAULT_ADDRESS);
        console.log(`Raw balance for ${poolName}:`, balance.toString());
        return {
          pool: poolName,
          balance: ethers.formatUnits(balance, 6)
        };
      })
    );
    console.log("Pool balances:", poolBalances);

    return {
      totalAssets: formattedTotal,
      poolBalances,
      message: `SuperVault Total Balance: ${formattedTotal} USDC\n` +
        `Pool Balances:\n${poolBalances.map(p => `${p.pool}: ${p.balance} USDC`).join('\n')}`
    };

  } catch (error) {
    console.error("Error in getVaultBalance:");
    console.error("Error message:", error.message);
    console.error("Error details:", error);
    throw error;
  }
};

export const getVaultBalanceMetadata = {
  name: "getVaultBalance",
  description: "Get the current balance of tokens in the SuperVault and its pools",
  schema: z.object({}),
}; 