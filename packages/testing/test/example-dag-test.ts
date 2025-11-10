/**
 * example-dag-test.ts
 * 
 * Example test file demonstrating DagDev testing framework
 * Shows how to use custom DAG matchers and test utilities
 * 
 * Run with: dagdev test test/example-dag-test.ts
 */

import { expect, use } from 'chai';
import { dagMatchers, setGlobalNode } from '../src';

// Register DAG matchers
use(dagMatchers);

// Access global dagdev runtime (injected by DagTestRunner)
declare global {
  var dagdev: any;
  var dagNode: any;
  var snapshot: (name?: string) => Promise<void>;
  var revert: (name?: string) => Promise<void>;
}

describe('🧪 DAG Testing Framework Example', function() {
  // Set longer timeout for blockchain operations
  this.timeout(10000);

  before(async function() {
    console.log('\n📋 Setting up test suite...');
    // Setup global node reference for matchers
    setGlobalNode(dagNode);
  });

  describe('Basic DAG Operations', function() {
    it('should start with genesis block', async function() {
      const depth = await dagdev.dag.getDepth();
      expect(depth).to.equal(0);

      const tips = await dagdev.dag.getTips();
      expect(tips).to.have.lengthOf(1);

      const genesis = await dagdev.dag.getGenesis();
      expect(genesis).to.not.be.null;
      expect(genesis.header.hash).to.be.a('string');
    });

    it('should mine parallel blocks', async function() {
      // Mine 4 blocks in parallel (2 rounds)
      await dagdev.mining.mineToDepth(2);

      const depth = await dagdev.dag.getDepth();
      expect(depth).to.equal(2);

      const stats = await dagdev.dag.getStats();
      expect(stats.totalBlocks).to.be.at.least(5); // genesis + 4 mined
      console.log(`    📊 DAG Stats: ${stats.totalBlocks} blocks, ${stats.tipCount} tips`);
    });

    it('should track blue set correctly', async function() {
      const blueSet = await dagdev.dag.getBlueSet();
      expect(blueSet).to.be.an('array');
      expect(blueSet.length).to.be.at.least(1);

      // All blue blocks should be marked as blue
      for (const hash of blueSet) {
        const isBlue = await dagdev.dag.isBlue(hash);
        expect(isBlue).to.be.true;
      }
    });
  });

  describe('Custom DAG Matchers', function() {
    let blockHash: string;

    before(async function() {
      // Mine a block and get its hash
      await dagdev.mining.mineToDepth(3);
      const tips = await dagdev.dag.getTips();
      blockHash = tips[0];
    });

    it('should use toBeInBlueSet matcher', async function() {
      const blueSet = await dagdev.dag.getBlueSet();
      const blueBlockHash = blueSet[0];

      // Custom matcher!
      expect(blueBlockHash).toBeInBlueSet();
    });

    it('should use toHaveParents matcher', async function() {
      const block = await dagdev.dag.getBlock(blockHash);
      const parentCount = block.header.parentHashes.length;

      // Custom matcher!
      expect(blockHash).toHaveParents(parentCount);
    });

    it('should use toHaveDepth matcher', async function() {
      const block = await dagdev.dag.getBlock(blockHash);
      
      // Custom matcher!
      expect(blockHash).toHaveDepth(block.depth);
    });

    it('should use toBeColoredBlue matcher', async function() {
      const blueSet = await dagdev.dag.getBlueSet();
      const blueBlockHash = blueSet[0];

      // Custom matcher!
      expect(blueBlockHash).toBeColoredBlue();
    });
  });

  describe('EVM Integration', function() {
    let testAccount: string;
    let contractAddress: string;

    before(async function() {
      // Create test accounts
      const accounts = await dagdev.evm.createTestAccounts(2, '100');
      testAccount = accounts[0].address;
      console.log(`    💰 Test account: ${testAccount}`);
    });

    it('should check account balance', async function() {
      const balance = await dagdev.evm.getBalance(testAccount);
      expect(balance).to.be.a('bigint');
      expect(balance).to.be.greaterThan(0n);

      const balanceEth = await dagdev.evm.formatEther(balance);
      console.log(`    💵 Balance: ${balanceEth} ETH`);
    });

    it('should deploy a smart contract', async function() {
      // Simple storage contract bytecode
      const bytecode = '0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d146051575b600080fd5b603d6069565b6040516048919060a0565b60405180910390f35b6067600480360381019060639190606b565b505050565b60005481565b600081359050606581608d565b92915050565b60006020828403121560805760006000fd5b600060878482850160588401565b91505092915050565b60008260ac91509190505600a165627a7a72305820';

      const result = await dagdev.evm.deploy(bytecode, testAccount);
      contractAddress = result.address;

      expect(contractAddress).to.be.a('string');
      expect(result.status).to.equal('0x1');
      console.log(`    📝 Contract deployed at: ${contractAddress}`);
    });

    it('should retrieve contract code', async function() {
      const code = await dagdev.evm.getCode(contractAddress);
      expect(code).to.be.a('string');
      expect(code).to.not.equal('0x');
      expect(code.length).to.be.greaterThan(2);
      console.log(`    🔍 Contract code length: ${code.length} chars`);
    });

    it('should estimate gas for transactions', async function() {
      const gas = await dagdev.evm.estimateGas({
        from: testAccount,
        to: contractAddress,
        data: '0x2e64cec1' // retrieve() function signature
      });

      expect(gas).to.be.a('bigint');
      expect(gas).to.be.greaterThan(0n);
      console.log(`    ⛽ Estimated gas: ${gas}`);
    });
  });

  describe('Transaction Confirmation', function() {
    let txHash: string;

    it('should send a transaction', async function() {
      const accounts = await dagdev.evm.createTestAccounts(2);
      const from = accounts[0].address;
      const to = accounts[1].address;

      // Fund the sender
      await dagdev.evm.setBalance(from, dagdev.evm.parseEther('10'));

      // Send transaction
      txHash = await dagdev.evm.sendTransaction({
        from,
        to,
        value: '0xde0b6b3a7640000', // 1 ETH in wei
        gas: '0x5208',
      });

      expect(txHash).to.be.a('string');
      expect(txHash).to.match(/^0x[0-9a-f]{64}$/);
      console.log(`    📤 Transaction sent: ${txHash.substring(0, 10)}...`);
    });

    it('should confirm transaction after mining', async function() {
      // Mine blocks to include the transaction
      await dagdev.mining.mineToDepth(6);

      // Transaction should be confirmed (in a blue block)
      expect(txHash).toBeConfirmed();
      console.log(`    ✅ Transaction confirmed`);
    });
  });

  describe('State Snapshots', function() {
    let initialDepth: number;

    it('should create a snapshot', async function() {
      initialDepth = await dagdev.dag.getDepth();
      await snapshot('test-snapshot');
      
      // Mine some blocks
      await dagdev.mining.mineToDepth(initialDepth + 2);
      
      const newDepth = await dagdev.dag.getDepth();
      expect(newDepth).to.equal(initialDepth + 2);
    });

    it('should revert to snapshot', async function() {
      await revert('test-snapshot');
      
      const currentDepth = await dagdev.dag.getDepth();
      // Note: DAG depth won't revert (it's not EVM state)
      // But EVM state (balances, nonces) will revert
      console.log(`    ⏮️  State reverted (DAG depth: ${currentDepth})`);
    });
  });

  describe('Advanced DAG Features', function() {
    it('should handle anticone correctly', async function() {
      await dagdev.mining.mineToDepth(5);
      
      const tips = await dagdev.dag.getTips();
      if (tips.length > 0) {
        const anticone = await dagdev.dag.getAnticone(tips[0]);
        expect(anticone).to.be.an('array');
        console.log(`    🔗 Anticone size: ${anticone.length}`);
      }
    });

    it('should calculate blue ratio', async function() {
      const stats = await dagdev.dag.getStats();
      expect(stats.blueRatio).to.be.a('number');
      expect(stats.blueRatio).to.be.at.least(0);
      expect(stats.blueRatio).to.be.at.most(100);
      console.log(`    📈 Blue ratio: ${stats.blueRatio.toFixed(2)}%`);
    });
  });

  after(function() {
    console.log('\n✅ Test suite completed\n');
  });
});
