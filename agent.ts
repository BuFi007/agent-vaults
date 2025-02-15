import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";

import {
  depositToVault,
  depositToVaultMetadata,
  depositToPool,
  depositToPoolMetadata,
  withdrawFromPool,
  withdrawFromPoolMetadata,
  allocateToStrategy,
  allocateToStrategyMetadata,
  getVaultBalance,
  getVaultBalanceMetadata,
} from "./tools/supervault";
import { getAaveApr, getAaveAprMetadata } from "./tools/aave";

class YieldOptimizer {
  private agent: any;
  private checkInterval: number;
  private isRunning: boolean = false;

  constructor(
    private readonly tokens: { symbol: string; address: string }[],
    checkIntervalMinutes: number = 60 // Default to 1 hour
  ) {
    this.checkInterval = checkIntervalMinutes * 60 * 1000;
  }

  async initialize() {
    const agentTools = [
      tool(depositToVault, depositToVaultMetadata),
      tool(depositToPool, depositToPoolMetadata),
      tool(withdrawFromPool, withdrawFromPoolMetadata),
      tool(allocateToStrategy, allocateToStrategyMetadata),
      tool(getAaveApr, getAaveAprMetadata),
      tool(getVaultBalance, getVaultBalanceMetadata),
    ];

    const agentModel = new ChatOpenAI({ 
      temperature: 0, 
      modelName: "gpt-4"
    });

    const agentCheckpointer = new MemorySaver();

    this.agent = createReactAgent({
      llm: agentModel,
      tools: agentTools,
      checkpointSaver: agentCheckpointer
    });
  }

  async checkAndOptimizeYield() {
    const tokenList = this.tokens
      .map(token => `${token.symbol} in Aave: ${token.address}`)
      .join("\n");

    const response = await this.agent.invoke(
      {
        messages: [
          new HumanMessage(
            `Monitor and optimize yield for these tokens:\n${tokenList}\n` +
            "1. Check current vault balance\n" +
            "2. Check current APR rates for all tokens\n" +
            "3. If current position has lower APR than alternatives by more than 0.5%, execute the following:\n" +
            "   - If funds are in vault and better rate exists, use depositToPool\n" +
            "   - If funds are in a pool with lower rate, use withdrawFromPool\n" +
            "4. Show detailed analysis of rates, actions taken, and final positions"
          ),
        ],
      },
      { configurable: { thread_id: "automated-yield-optimization" } }
    );

    // Execute the transaction if APR difference is significant
    const vaultBalance = await getVaultBalance();
    console.log("Current vault balance:", vaultBalance);

    // Test withdrawal - will withdraw 0.1 USDC from the pool
    if (parseFloat(vaultBalance.poolBalances[0].balance) > 0) {
      console.log("Testing withdrawal from Aave pool...");
      await withdrawFromPool({
        poolName: "AAVE",
        amount: "0.1"  // Test with 0.1 USDC
      });
    }

    console.log("Optimization Check Result:", 
      response.messages[response.messages.length - 1].content
    );
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    const runCheck = async () => {
      if (!this.isRunning) return;
      
      try {
        await this.checkAndOptimizeYield();
      } catch (error) {
        console.error("Error during yield optimization:", error);
      }
      
      // Schedule next check
      setTimeout(runCheck, this.checkInterval);
    };

    // Start the first check
    runCheck();
  }

  stop() {
    this.isRunning = false;
  }
}

const main = async () => {
  // Define tokens to monitor
  const tokens = [
    { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
    { symbol: "USDT", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" },
    { symbol: "WAVAX", address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7" }
  ];

  // Create and start the yield optimizer
  const optimizer = new YieldOptimizer(tokens, 60); // Check every hour
  await optimizer.initialize();
  optimizer.start();

  // Optional: Stop after 24 hours
  // setTimeout(() => optimizer.stop(), 24 * 60 * 60 * 1000);
};

main().catch(console.error);
