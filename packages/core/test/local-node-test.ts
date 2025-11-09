/**
 * LocalNode Integration Test
 * 
 * Tests the full LocalNode orchestrator with:
 * - DAG graph
 * - Parallel mining
 * - Transaction pool
 * - Event handling
 * - Node lifecycle (start/stop)
 */

import { LocalNode } from '../src/network/LocalNode';
import { Transaction } from '../src/dag/Block';
import crypto from 'crypto';

console.log('='.repeat(70));
console.log('🧪 LOCALNODE INTEGRATION TEST');
console.log('='.repeat(70));
console.log();

// Create node with custom configuration
const node = new LocalNode({
  port: 8545,
  wsPort: 8546,
  k: 18,
  txPoolSize: 100,
  miningConfig: {
    parallelism: 3,
    blockTime: 2000,
    maxParents: 3,
  },
});

console.log('✅ LocalNode created with configuration:');
console.log(JSON.stringify(node.getConfig(), null, 2));
console.log();

// Setup event listeners
let blocksMinedCount = 0;
let transactionsAddedCount = 0;

node.on('started', () => {
  console.log('📢 Event: Node started');
});

node.on('stopped', () => {
  console.log('📢 Event: Node stopped');
});

node.on('miningStarted', () => {
  console.log('📢 Event: Mining started');
});

node.on('miningStopped', () => {
  console.log('📢 Event: Mining stopped');
});

node.on('blockMined', (block) => {
  blocksMinedCount++;
  console.log(`📢 Event: Block mined #${blocksMinedCount} - ${block.header.hash.substring(0, 8)}...`);
});

node.on('transactionAdded', (tx) => {
  transactionsAddedCount++;
  console.log(`📢 Event: Transaction added #${transactionsAddedCount} - ${tx.hash.substring(0, 8)}...`);
});

// Create sample transactions
function createTransaction(from: string, to: string, value: bigint, gasPrice: bigint): Transaction {
  const nonce = Math.floor(Math.random() * 1000000);
  const data = JSON.stringify({ from, to, value: value.toString(), nonce });
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  return {
    hash,
    from,
    to,
    value,
    gasPrice,
    nonce,
    data: '',
    gasLimit: BigInt(21000),
  };
}

async function runTest() {
  console.log('━'.repeat(70));
  console.log('PHASE 1: Add Transactions to Pool');
  console.log('━'.repeat(70));
  console.log();

  // Add transactions with different gas prices
  const tx1 = createTransaction('alice', 'bob', BigInt(100), BigInt(10)); // 10 gwei
  const tx2 = createTransaction('bob', 'charlie', BigInt(200), BigInt(50)); // 50 gwei (highest)
  const tx3 = createTransaction('charlie', 'alice', BigInt(150), BigInt(20)); // 20 gwei
  const tx4 = createTransaction('alice', 'charlie', BigInt(75), BigInt(5)); // 5 gwei (lowest)

  node.addTransaction(tx1);
  node.addTransaction(tx2);
  node.addTransaction(tx3);
  node.addTransaction(tx4);

  console.log(`✅ Added 4 transactions to pool`);
  console.log();

  // Show initial stats before mining
  console.log('━'.repeat(70));
  console.log('PHASE 2: Pre-Mining Statistics');
  console.log('━'.repeat(70));
  console.log();

  let stats = node.getStats();
  console.log('Node Stats:', JSON.stringify(stats, null, 2));
  console.log();

  // Start the node
  console.log('━'.repeat(70));
  console.log('PHASE 3: Start Node & Mine Blocks');
  console.log('━'.repeat(70));
  console.log();

  await node.start();
  console.log();

  // Let it mine for a few rounds
  console.log('⏳ Mining for 8 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Stop the node
  console.log('━'.repeat(70));
  console.log('PHASE 4: Stop Node');
  console.log('━'.repeat(70));
  console.log();

  await node.stop();
  console.log();

  // Show final statistics
  console.log('━'.repeat(70));
  console.log('PHASE 5: Final Statistics & Analysis');
  console.log('━'.repeat(70));
  console.log();

  stats = node.getStats();
  console.log('📊 Final Node Statistics:');
  console.log(JSON.stringify(stats, null, 2));
  console.log();

  // Analyze DAG structure
  const dag = node.getDAG();
  const tips = dag.getTips();
  const allBlocks = dag.getAllBlocks();
  
  console.log('📊 DAG Structure Analysis:');
  console.log(`  Total Blocks: ${allBlocks.length}`);
  console.log(`  Current Tips: ${tips.length}`);
  console.log(`  Tips: ${tips.map(t => t.substring(0, 8)).join(', ')}`);
  console.log();

  // Show block structure
  console.log('📊 Block Structure:');
  allBlocks.forEach((block, index) => {
    const isGenesis = block.header.parentHashes.length === 0;
    const isTip = tips.includes(block.header.hash);
    
    console.log(`  Block ${index + 1}: ${block.header.hash.substring(0, 8)}... | ` +
                `Parents: ${block.header.parentHashes.length} | ` +
                `Depth: ${block.dagDepth} | ` +
                `Color: ${block.color} | ` +
                `Txs: ${block.transactions.length}${isGenesis ? ' (genesis)' : ''}${isTip ? ' (tip)' : ''}`);
  });
  console.log();

  // Calculate metrics
  const blueBlocks = allBlocks.filter(b => b.color === 'blue');
  const redBlocks = allBlocks.filter(b => b.color === 'red');
  const totalBlocks = allBlocks.length;
  const blocksWithTxs = allBlocks.filter(b => b.transactions.length > 0);
  
  console.log('📊 Summary Metrics:');
  console.log(`  Total Blocks: ${totalBlocks}`);
  console.log(`  Blue Blocks: ${blueBlocks.length} (${(blueBlocks.length / totalBlocks * 100).toFixed(1)}%)`);
  console.log(`  Red Blocks: ${redBlocks.length} (${(redBlocks.length / totalBlocks * 100).toFixed(1)}%)`);
  console.log(`  Blocks with Transactions: ${blocksWithTxs.length}`);
  console.log(`  Total Transactions Processed: ${allBlocks.reduce((sum, b) => sum + b.transactions.length, 0)}`);
  console.log(`  Events Fired:`);
  console.log(`    - Blocks Mined: ${blocksMinedCount}`);
  console.log(`    - Transactions Added: ${transactionsAddedCount}`);
  console.log();

  // Test manual mining
  console.log('━'.repeat(70));
  console.log('PHASE 6: Manual Mining Test');
  console.log('━'.repeat(70));
  console.log();

  console.log('⛏️  Mining 3 blocks manually...');
  const beforeCount = node.getMiner().getBlocksMinedCount();
  await node.mineBlocks(3);
  const afterCount = node.getMiner().getBlocksMinedCount();
  
  console.log(`✅ Mined ${afterCount - beforeCount} blocks manually`);
  console.log();

  // Final stats
  stats = node.getStats();
  console.log('📊 Final Statistics After Manual Mining:');
  console.log(`  Total Blocks in DAG: ${node.getDAG().getAllBlocks().length}`);
  console.log(`  Blocks Mined by Node: ${stats.miner.blocksMined}`);
  console.log();

  console.log('='.repeat(70));
  console.log('✅ LOCALNODE INTEGRATION TEST COMPLETE');
  console.log('='.repeat(70));
}

// Run the test
runTest().catch(console.error);
