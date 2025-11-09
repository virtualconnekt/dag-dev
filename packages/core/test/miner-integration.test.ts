/**
 * Miner + TransactionPool Integration Test
 * 
 * Tests the interaction between the Miner and TransactionPool
 * to verify parallel block mining with transactions works correctly.
 */

import { DAGGraph } from '../src/dag/DAGGraph';
import { Miner } from '../src/dag/Miner';
import { TransactionPool } from '../src/network/TransactionPool';
import { Block, Transaction } from '../src/dag/Block';

describe('Miner + TransactionPool Integration', () => {
  let dag: DAGGraph;
  let miner: Miner;
  let txPool: TransactionPool;

  beforeEach(() => {
    // Create fresh instances for each test
    dag = new DAGGraph(18); // k=18 (Kaspa default)
    miner = new Miner(dag, {
      parallelism: 3,
      blockTime: 100, // Fast for testing (100ms)
      maxParents: 3,
      minerAddress: '0xMiner123',
    });
    txPool = new TransactionPool(1000);
    
    // Connect miner to transaction pool
    miner.setTransactionPool(txPool);
  });

  afterEach(() => {
    // Stop mining to clean up timers
    if (miner.isMining()) {
      miner.stopMining();
    }
  });

  it('should create DAG with genesis block', () => {
    const stats = dag.getStats();
    
    expect(stats.totalBlocks).toBe(1);
    expect(stats.blueBlocks).toBe(1);
    expect(stats.tips).toBe(1);
    expect(stats.maxDepth).toBe(0);
  });

  it('should mine blocks in parallel', (done) => {
    let blocksMinedCount = 0;

    // Listen for block mined events
    miner.on('blockMined', (block: Block) => {
      blocksMinedCount++;
      console.log(`Block mined: ${block.header.hash.substring(0, 8)}...`);
      
      // After first round (3 blocks), check stats
      if (blocksMinedCount === 3) {
        const stats = dag.getStats();
        
        // Should have genesis + 3 new blocks
        expect(stats.totalBlocks).toBe(4);
        expect(stats.blueBlocks).toBeGreaterThanOrEqual(3); // Most should be blue
        expect(stats.tips).toBe(3); // 3 new tips
        expect(stats.maxDepth).toBe(1); // All at depth 1
        
        miner.stopMining();
        done();
      }
    });

    miner.startMining();
  }, 5000);

  it('should include transactions in mined blocks', (done) => {
    // Create some test transactions
    const tx1: Transaction = {
      hash: '0xTX1',
      from: '0xAlice',
      to: '0xBob',
      value: 100n,
      data: '0x',
      nonce: 0,
      gasLimit: 21000n,
      gasPrice: 1000000000n, // 1 gwei
    };

    const tx2: Transaction = {
      hash: '0xTX2',
      from: '0xAlice',
      to: '0xCharlie',
      value: 50n,
      data: '0x',
      nonce: 1,
      gasLimit: 21000n,
      gasPrice: 2000000000n, // 2 gwei (higher priority)
    };

    // Add transactions to pool
    txPool.addTransaction(tx1);
    txPool.addTransaction(tx2);

    expect(txPool.size()).toBe(2);

    let blocksChecked = 0;

    miner.on('blockMined', (block: Block) => {
      blocksChecked++;
      
      // Check if any blocks include transactions
      if (block.transactions.length > 0) {
        console.log(`Block ${block.header.hash.substring(0, 8)}... includes ${block.transactions.length} transactions`);
        
        // Verify transactions are sorted by gas price
        for (let i = 0; i < block.transactions.length - 1; i++) {
          expect(block.transactions[i].gasPrice).toBeGreaterThanOrEqual(
            block.transactions[i + 1].gasPrice
          );
        }
      }

      // After mining 3 blocks, stop and verify
      if (blocksChecked === 3) {
        miner.stopMining();
        
        // Check that at least one block included transactions
        const allBlocks = dag.getAllBlocks();
        const blocksWithTxs = allBlocks.filter(b => b.transactions.length > 0);
        
        expect(blocksWithTxs.length).toBeGreaterThan(0);
        console.log(`${blocksWithTxs.length} blocks included transactions`);
        
        done();
      }
    });

    miner.startMining();
  }, 5000);

  it('should create DAG structure (not linear chain)', (done) => {
    let roundsCompleted = 0;

    miner.on('blockMined', () => {
      const stats = dag.getStats();
      
      // After each round of 3 blocks
      if (stats.totalBlocks >= 4 && stats.totalBlocks % 3 === 1) {
        roundsCompleted++;
        
        console.log(`\nRound ${roundsCompleted} stats:`, stats);
        
        // Verify DAG properties
        expect(stats.tips).toBeGreaterThan(1); // Multiple tips = DAG structure
        
        // Check that blocks have multiple parents
        const blocks = dag.getAllBlocks();
        const blocksWithMultipleParents = blocks.filter(
          b => b.header.parentHashes.length > 1
        ).length;
        
        if (roundsCompleted >= 2) {
          expect(blocksWithMultipleParents).toBeGreaterThan(0);
          console.log(`Blocks with multiple parents: ${blocksWithMultipleParents}`);
        }
        
        // After 2 rounds, stop test
        if (roundsCompleted === 2) {
          miner.stopMining();
          done();
        }
      }
    });

    miner.startMining();
  }, 10000);

  it('should compute blue/red coloring with GHOSTDAG', (done) => {
    let blocksMinedCount = 0;

    miner.on('blockMined', () => {
      blocksMinedCount++;
      
      // After mining 9 blocks (3 rounds)
      if (blocksMinedCount === 9) {
        const stats = dag.getStats();
        
        console.log('\nGHOSTDAG Coloring Results:');
        console.log(`Total blocks: ${stats.totalBlocks}`);
        console.log(`Blue blocks: ${stats.blueBlocks}`);
        console.log(`Red blocks: ${stats.redBlocks}`);
        console.log(`Blue ratio: ${(stats.blueBlocks / stats.totalBlocks * 100).toFixed(1)}%`);
        
        // Most blocks should be blue (>90% in healthy DAG)
        const blueRatio = stats.blueBlocks / stats.totalBlocks;
        expect(blueRatio).toBeGreaterThan(0.8); // At least 80% blue
        
        // List block colors
        const blocks = dag.getAllBlocks();
        blocks.forEach(block => {
          console.log(
            `  Block ${block.header.hash.substring(0, 8)}... ` +
            `[${block.color === 'blue' ? '🔵' : '🔴'}] ` +
            `depth=${block.dagDepth} parents=${block.header.parentHashes.length}`
          );
        });
        
        miner.stopMining();
        done();
      }
    });

    miner.startMining();
  }, 10000);

  it('should handle start/stop mining correctly', () => {
    expect(miner.isMining()).toBe(false);
    
    miner.startMining();
    expect(miner.isMining()).toBe(true);
    
    miner.stopMining();
    expect(miner.isMining()).toBe(false);
    
    // Should not error on double stop
    miner.stopMining();
    expect(miner.isMining()).toBe(false);
  });

  it('should track mined blocks count', (done) => {
    expect(miner.getBlocksMinedCount()).toBe(0);
    
    let eventCount = 0;
    miner.on('blockMined', () => {
      eventCount++;
      
      if (eventCount === 6) {
        expect(miner.getBlocksMinedCount()).toBe(6);
        miner.stopMining();
        done();
      }
    });

    miner.startMining();
  }, 5000);

  it('should prioritize transactions by gas price', () => {
    // Add transactions with different gas prices
    const lowGasTx: Transaction = {
      hash: '0xLowGas',
      from: '0xUser1',
      to: '0xUser2',
      value: 10n,
      data: '0x',
      nonce: 0,
      gasLimit: 21000n,
      gasPrice: 1000000000n, // 1 gwei
    };

    const highGasTx: Transaction = {
      hash: '0xHighGas',
      from: '0xUser1',
      to: '0xUser2',
      value: 10n,
      data: '0x',
      nonce: 1,
      gasLimit: 21000n,
      gasPrice: 10000000000n, // 10 gwei
    };

    const mediumGasTx: Transaction = {
      hash: '0xMediumGas',
      from: '0xUser1',
      to: '0xUser2',
      value: 10n,
      data: '0x',
      nonce: 2,
      gasLimit: 21000n,
      gasPrice: 5000000000n, // 5 gwei
    };

    txPool.addTransaction(lowGasTx);
    txPool.addTransaction(highGasTx);
    txPool.addTransaction(mediumGasTx);

    // Get pending transactions (should be sorted)
    const pending = txPool.getPending();

    expect(pending.length).toBe(3);
    expect(pending[0].hash).toBe('0xHighGas');   // Highest gas price first
    expect(pending[1].hash).toBe('0xMediumGas'); // Medium gas price second
    expect(pending[2].hash).toBe('0xLowGas');    // Lowest gas price last
  });

  it('should emit mining events', (done) => {
    let startedEmitted = false;
    let stoppedEmitted = false;

    miner.on('miningStarted', () => {
      startedEmitted = true;
      console.log('Mining started event received');
      
      // Stop after a short delay
      setTimeout(() => {
        miner.stopMining();
      }, 200);
    });

    miner.on('miningStopped', () => {
      stoppedEmitted = true;
      console.log('Mining stopped event received');
      
      expect(startedEmitted).toBe(true);
      expect(stoppedEmitted).toBe(true);
      done();
    });

    miner.startMining();
  }, 5000);
});
