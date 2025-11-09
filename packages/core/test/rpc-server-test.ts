/**
 * RPC Server Integration Test
 * 
 * Tests both standard eth_* methods and custom dag_* methods
 */

import { LocalNode } from '../src/network/LocalNode';
import crypto from 'crypto';

console.log('='.repeat(70));
console.log('🧪 RPC SERVER INTEGRATION TEST');
console.log('='.repeat(70));
console.log();

// Helper function to make RPC calls
async function rpcCall(method: string, params: any[] = []): Promise<any> {
  const response = await fetch('http://localhost:8545', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  
  const json = await response.json();
  
  if (json.error) {
    throw new Error(`RPC Error: ${json.error.message}`);
  }
  
  return json.result;
}

async function runTest() {
  // Create and start node
  const node = new LocalNode({
    port: 8545,
    k: 18,
    miningConfig: {
      parallelism: 3,
      blockTime: 2000,
    },
  });

  console.log('✅ LocalNode created\n');

  // Start node (includes RPC server)
  await node.start();
  console.log();

  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    console.log('━'.repeat(70));
    console.log('TEST 1: Standard Ethereum Methods (eth_*)');
    console.log('━'.repeat(70));
    console.log();

    // Test eth_chainId
    const chainId = await rpcCall('eth_chainId');
    console.log(`✅ eth_chainId: ${chainId}`);

    // Test eth_blockNumber
    const blockNumber = await rpcCall('eth_blockNumber');
    console.log(`✅ eth_blockNumber: ${blockNumber} (${parseInt(blockNumber, 16)})`);

    // Test eth_getBalance
    const balance = await rpcCall('eth_getBalance', [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      'latest',
    ]);
    console.log(`✅ eth_getBalance: ${balance} (${BigInt(balance)} wei)`);

    // Test eth_accounts
    const accounts = await rpcCall('eth_accounts');
    console.log(`✅ eth_accounts: ${accounts.length} accounts`);

    // Test eth_gasPrice
    const gasPrice = await rpcCall('eth_gasPrice');
    console.log(`✅ eth_gasPrice: ${gasPrice}`);

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 2: DAG-Specific Methods (dag_*)');
    console.log('━'.repeat(70));
    console.log();

    // Test dag_getDAGInfo
    const dagInfo = await rpcCall('dag_getDAGInfo');
    console.log('✅ dag_getDAGInfo:');
    console.log(JSON.stringify(dagInfo, null, 2));

    console.log();

    // Test dag_getTips
    const tips = await rpcCall('dag_getTips');
    console.log(`✅ dag_getTips: ${tips.length} tips`);
    tips.forEach((tip: any, i: number) => {
      console.log(`  Tip ${i + 1}: ${tip.hash.substring(0, 8)}... (depth: ${tip.depth}, color: ${tip.color})`);
    });

    console.log();

    // Test dag_getBlueSet
    const blueSet = await rpcCall('dag_getBlueSet');
    console.log(`✅ dag_getBlueSet: ${blueSet.length} blue blocks`);

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 3: Transaction Submission');
    console.log('━'.repeat(70));
    console.log();

    // Test eth_sendTransaction
    const txHash1 = await rpcCall('eth_sendTransaction', [{
      from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: '0xde0b6b3a7640000', // 1 ETH
      gasPrice: '0x3b9aca00',
    }]);
    console.log(`✅ eth_sendTransaction: ${txHash1}`);

    // Test dag_sendTransaction
    const txResult = await rpcCall('dag_sendTransaction', [{
      from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: '0x2386f26fc10000', // 0.01 ETH
      gasPrice: '0x77359400', // 2 gwei
    }]);
    console.log('✅ dag_sendTransaction:');
    console.log(JSON.stringify(txResult, null, 2));

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 4: Block Queries');
    console.log('━'.repeat(70));
    console.log();

    // Let mining run for a bit
    console.log('⏳ Mining blocks for 4 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Get updated block number
    const newBlockNumber = await rpcCall('eth_blockNumber');
    console.log(`✅ eth_blockNumber (after mining): ${newBlockNumber} (${parseInt(newBlockNumber, 16)})`);

    // Test eth_getBlockByNumber
    const block = await rpcCall('eth_getBlockByNumber', ['latest', false]);
    if (block) {
      console.log('✅ eth_getBlockByNumber:');
      console.log(`  Hash: ${block.hash.substring(0, 16)}...`);
      console.log(`  Number: ${block.number}`);
      console.log(`  Parent: ${block.parentHash.substring(0, 16)}...`);
      console.log(`  Parents: ${block.parentHashes.length}`);
      console.log(`  Color: ${block.color}`);
      console.log(`  DAG Depth: ${block.dagDepth}`);
      console.log(`  Blue Score: ${block.blueScore}`);
      console.log(`  Transactions: ${block.transactions.length}`);
    }

    console.log();

    // Test eth_getBlockByHash
    if (block) {
      const blockByHash = await rpcCall('eth_getBlockByHash', [block.hash, true]);
      console.log('✅ eth_getBlockByHash (with full txs):');
      console.log(`  Hash: ${blockByHash.hash.substring(0, 16)}...`);
      console.log(`  Transactions: ${blockByHash.transactions.length}`);
      if (blockByHash.transactions.length > 0) {
        const tx = blockByHash.transactions[0];
        console.log(`  First TX: ${tx.hash.substring(0, 16)}... (${tx.from.substring(0, 10)}... → ${tx.to.substring(0, 10)}...)`);
      }
    }

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 5: DAG Structure Queries');
    console.log('━'.repeat(70));
    console.log();

    // Get a block hash to query
    const newTips = await rpcCall('dag_getTips');
    if (newTips.length > 0) {
      const tipHash = newTips[0].hash;

      // Test dag_getBlockByHash
      const dagBlock = await rpcCall('dag_getBlockByHash', [tipHash]);
      console.log('✅ dag_getBlockByHash:');
      console.log(`  Hash: ${dagBlock.hash.substring(0, 16)}...`);
      console.log(`  Parents: ${dagBlock.parentHashes.length}`);
      console.log(`  Color: ${dagBlock.color}`);
      console.log(`  Depth: ${dagBlock.dagDepth}`);

      console.log();

      // Test dag_getBlockParents
      const parents = await rpcCall('dag_getBlockParents', [tipHash]);
      console.log(`✅ dag_getBlockParents: ${parents.length} parents`);
      parents.forEach((parent: any, i: number) => {
        console.log(`  Parent ${i + 1}: ${parent.hash.substring(0, 8)}... (depth: ${parent.depth}, color: ${parent.color})`);
      });

      console.log();

      // Test dag_getBlockChildren (for a parent)
      if (parents.length > 0) {
        const children = await rpcCall('dag_getBlockChildren', [parents[0].hash]);
        console.log(`✅ dag_getBlockChildren: ${children.length} children`);
      }

      console.log();

      // Test dag_getAnticone
      const anticone = await rpcCall('dag_getAnticone', [tipHash]);
      console.log(`✅ dag_getAnticone: ${anticone.length} blocks in anticone`);
      if (anticone.length > 0) {
        anticone.slice(0, 3).forEach((block: any, i: number) => {
          console.log(`  Anticone ${i + 1}: ${block.hash.substring(0, 8)}... (depth: ${block.depth})`);
        });
      }

      console.log();

      // Test dag_getBlueScore
      const blueScore = await rpcCall('dag_getBlueScore', [tipHash]);
      console.log('✅ dag_getBlueScore:');
      console.log(JSON.stringify(blueScore, null, 2));
    }

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 6: Mining Control via RPC');
    console.log('━'.repeat(70));
    console.log();

    // Test dag_mineBlocks
    const mineResult = await rpcCall('dag_mineBlocks', [3]);
    console.log('✅ dag_mineBlocks:');
    console.log(JSON.stringify(mineResult, null, 2));

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 7: Network Methods (net_*)');
    console.log('━'.repeat(70));
    console.log();

    // Test net_version
    const netVersion = await rpcCall('net_version');
    console.log(`✅ net_version: ${netVersion}`);

    // Test net_listening
    const netListening = await rpcCall('net_listening');
    console.log(`✅ net_listening: ${netListening}`);

    // Test net_peerCount
    const peerCount = await rpcCall('net_peerCount');
    console.log(`✅ net_peerCount: ${peerCount}`);

    console.log();
    console.log('━'.repeat(70));
    console.log('TEST 8: Final Statistics');
    console.log('━'.repeat(70));
    console.log();

    const finalStats = await rpcCall('dag_getStats');
    console.log('📊 Final DAG Statistics:');
    console.log(JSON.stringify(finalStats, null, 2));

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Stop node
    console.log();
    console.log('━'.repeat(70));
    console.log('Cleanup');
    console.log('━'.repeat(70));
    console.log();
    
    await node.stop();

    console.log();
    console.log('='.repeat(70));
    console.log('✅ RPC SERVER TEST COMPLETE');
    console.log('='.repeat(70));
    
    process.exit(0);
  }
}

// Run test
runTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
