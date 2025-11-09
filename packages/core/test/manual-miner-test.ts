/**
 * Manual Integration Test: Miner + TransactionPool
 * 
 * Run this script to test Miner and TransactionPool integration
 * without needing a test runner.
 * 
 * Usage: npx ts-node test/manual-miner-test.ts
 */

import { DAGGraph } from '../src/dag/DAGGraph';
import { Miner } from '../src/dag/Miner';
import { TransactionPool } from '../src/network/TransactionPool';
import { Transaction } from '../src/dag/Block';

console.log('🚀 DagDev - Miner + TransactionPool Integration Test\n');
console.log('='.repeat(60));

// Create instances
const dag = new DAGGraph(18); // k=18 (Kaspa default)
const txPool = new TransactionPool(1000);
const miner = new Miner(dag, {
  parallelism: 3,      // Mine 3 blocks per round
  blockTime: 2000,     // Every 2 seconds
  maxParents: 3,       // Max 3 parents per block
  minerAddress: '0xMiner123ABC',
});

// Connect miner to transaction pool
miner.setTransactionPool(txPool);

console.log('\n📊 Initial DAG State:');
console.log(dag.getStats());

// Add some test transactions
console.log('\n💼 Adding test transactions to pool...');

const tx1: Transaction = {
  hash: '0xTX0001',
  from: '0xAlice',
  to: '0xBob',
  value: 100n,
  data: '0x',
  nonce: 0,
  gasLimit: 21000n,
  gasPrice: 1000000000n, // 1 gwei
};

const tx2: Transaction = {
  hash: '0xTX0002',
  from: '0xAlice',
  to: '0xCharlie',
  value: 50n,
  data: '0x',
  nonce: 1,
  gasLimit: 21000n,
  gasPrice: 5000000000n, // 5 gwei (higher priority)
};

const tx3: Transaction = {
  hash: '0xTX0003',
  from: '0xBob',
  to: '0xDavid',
  value: 25n,
  data: '0x',
  nonce: 0,
  gasLimit: 21000n,
  gasPrice: 2000000000n, // 2 gwei
};

txPool.addTransaction(tx1);
txPool.addTransaction(tx2);
txPool.addTransaction(tx3);

console.log(`✓ Added ${txPool.size()} transactions to pool`);

// Listen to mining events
let blocksMinedCount = 0;

miner.on('miningStarted', () => {
  console.log('\n⛏️  Mining started!');
});

miner.on('blockMined', (block) => {
  blocksMinedCount++;
  
  console.log(`\n✓ Block mined #${blocksMinedCount}:`);
  console.log(`  Hash: ${block.header.hash.substring(0, 16)}...`);
  console.log(`  Parents: ${block.header.parentHashes.length}`);
  console.log(`  Depth: ${block.dagDepth}`);
  console.log(`  Color: ${block.color === 'blue' ? '🔵 BLUE' : '🔴 RED'}`);
  console.log(`  Transactions: ${block.transactions.length}`);
  
  if (block.transactions.length > 0) {
    block.transactions.forEach((tx, i) => {
      console.log(`    ${i + 1}. ${tx.hash} (${tx.gasPrice} wei gas price)`);
    });
  }
});

miner.on('miningStopped', () => {
  console.log('\n⏹️  Mining stopped!');
  
  // Final statistics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final DAG Statistics:');
  const finalStats = dag.getStats();
  console.log(finalStats);
  console.log(`\nBlue Ratio: ${(finalStats.blueBlocks / finalStats.totalBlocks * 100).toFixed(1)}%`);
  console.log(`Blocks Mined: ${miner.getBlocksMinedCount()}`);
  console.log(`Transactions Remaining: ${txPool.size()}`);
  
  // List all blocks
  console.log('\n📦 All Blocks in DAG:');
  const blocks = dag.getAllBlocks();
  blocks.forEach((block, i) => {
    const colorEmoji = block.color === 'blue' ? '🔵' : block.color === 'red' ? '🔴' : '⚪';
    console.log(
      `  ${i + 1}. ${colorEmoji} ${block.header.hash.substring(0, 12)}... ` +
      `depth=${block.dagDepth} parents=${block.header.parentHashes.length} ` +
      `txs=${block.transactions.length}`
    );
  });
  
  // Visualize DAG tips
  console.log('\n🎯 Current DAG Tips:');
  const tips = dag.getTips();
  tips.forEach((tipHash, i) => {
    const tip = dag.getBlock(tipHash);
    console.log(`  ${i + 1}. ${tipHash.substring(0, 12)}... (depth ${tip?.dagDepth})`);
  });
  
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
});

// Start mining
console.log('\n⛏️  Starting mining with config:');
console.log(miner.getConfig());

miner.startMining();

// Mine for 3 rounds (6 seconds), then stop
setTimeout(() => {
  console.log('\n⏸️  Stopping mining after 3 rounds...');
  miner.stopMining();
}, 6500);
