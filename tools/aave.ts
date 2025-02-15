import { ethers } from "ethers";
import { z } from "zod";

// Aave mainnet addresses
const AAVE_POOL_DATA_PROVIDER = "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654";
const AVALANCHE_RPC_URL = "https://api.avax.network/ext/bc/C/rpc";

const POOL_DATA_PROVIDER_ABI = [
  "function getReserveData(address asset) external view returns (tuple(uint256 unbacked, uint256 accruedToTreasury, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp))",
];

export const getAaveApr = async ({ tokenAddress }: { tokenAddress: string }) => {
  const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC_URL);
  
  const dataProvider = new ethers.Contract(
    AAVE_POOL_DATA_PROVIDER,
    POOL_DATA_PROVIDER_ABI,
    provider
  );

  const reserveData = await dataProvider.getReserveData(tokenAddress);
  
  // Aave returns RAY units (1e27) for rates
  const RAY = ethers.parseUnits("1", 27);
  const SECONDS_PER_YEAR = 31536000;
  
  // Convert liquidityRate (deposit APR) from RAY to percentage
  const depositApr = (Number(reserveData.liquidityRate) / Number(RAY)) * 100;
  
  // Convert variableBorrowRate from RAY to percentage
  const variableBorrowApr = (Number(reserveData.variableBorrowRate) / Number(RAY)) * 100;

  return `For token ${tokenAddress}:
    Deposit APR: ${depositApr.toFixed(2)}%
    Variable Borrow APR: ${variableBorrowApr.toFixed(2)}%`;
};

export const getAaveAprMetadata = {
  name: "getAaveApr",
  description: "Get the current APR rates for a token in Aave V3 on Avalanche",
  schema: z.object({
    tokenAddress: z.string().describe("The address of the token to check rates for"),
  }),
}; 