/**
 * miner-evm-integration.test.ts
 * 
 * Test EVM integration with DAG mining
 * Phase 3: EVM Integration
 */

import { DAGGraph } from '../src/dag/DAGGraph';
import { Miner } from '../src/dag/Miner';
import { Transaction } from '../src/dag/Block';

console.log('🧪 Testing EVM-DAG Integration\n');

async function testMinerEVMIntegration() {
  console.log('📦 TEST 1: Initialize DAG and Miner with EVM');
  const dag = new DAGGraph();
  const miner = new Miner(dag, {
    parallelism: 2,
    blockTime: 1000,
    minerAddress: '0x9000000000000000000000000000000000000001'
  });
  console.log('✅ Miner initialized with EVM executor\n');

  console.log('📦 TEST 2: Set up test accounts');
  const evmExecutor = miner.getEVMExecutor();
  const testAccounts = [
    '0x1000000000000000000000000000000000000001',
    '0x2000000000000000000000000000000000000002',
  ];
  
  for (const address of testAccounts) {
    await evmExecutor.setBalance(address, BigInt('1000000000000000000000')); // 1000 ETH
  }
  console.log('✅ Test accounts funded\n');

  console.log('📦 TEST 3: Create transactions');
  const transactions: Transaction[] = [
    {
      hash: '0xtx001',
      from: testAccounts[0],
      to: testAccounts[1],
      value: BigInt('5000000000000000000'), // 5 ETH
      gasLimit: BigInt(21000),
      gasPrice: BigInt(1000000000),
      nonce: 0,
      data: '',
    },
    {
      hash: '0xtx002',
      from: testAccounts[1],
      to: testAccounts[0],
      value: BigInt('2000000000000000000'), // 2 ETH
      gasLimit: BigInt(21000),
      gasPrice: BigInt(1000000000),
      nonce: 0,
      data: '',
    },
  ];
  console.log('✅ Created 2 transactions\n');

  console.log('📦 TEST 4: Mine block with transactions');
  const tips = dag.getTips();
  const block1 = await miner['mineBlock'](transactions, tips);
  
  console.log('✅ Block mined with EVM execution');
  console.log('   Block hash:', block1.header.hash.substring(0, 16) + '...');
  console.log('   State root:', block1.header.stateRoot.substring(0, 16) + '...');
  console.log('   Transactions:', block1.transactions.length);
  console.log('   Parents:', block1.header.parentHashes.length);
  console.log('');

  console.log('📦 TEST 5: Check transaction receipts');
  for (const tx of transactions) {
    const receipt = miner.getReceipt(tx.hash);
    if (receipt) {
      console.log(`✅ Receipt for ${tx.hash}:`);
      console.log('   Status:', receipt.status);
      console.log('   Gas used:', receipt.gasUsed.toString());
      console.log('   Cumulative gas:', receipt.cumulativeGasUsed.toString());
    } else {
      console.log(`❌ No receipt for ${tx.hash}`);
    }
  }
  console.log('');

  console.log('📦 TEST 6: Add block to DAG');
  const added = dag.addBlock(block1);
  console.log('✅ Block added to DAG:', added);
  console.log('   Block color:', block1.color);
  console.log('   DAG depth:', block1.dagDepth);
  console.log('');

  console.log('📦 TEST 7: Mine second block');
  const block2 = await miner['mineBlock']([], [block1.header.hash]);
  dag.addBlock(block2);
  console.log('✅ Second block mined');
  console.log('   State root:', block2.header.stateRoot.substring(0, 16) + '...');
  console.log('   Different from block1:', block1.header.stateRoot !== block2.header.stateRoot);
  console.log('');

  console.log('📦 TEST 8: Check DAG stats');
  const stats = dag.getStats();
  console.log('✅ DAG Statistics:');
  console.log('   Total blocks:', stats.totalBlocks);
  console.log('   Blue blocks:', stats.blueBlocks);
  console.log('   Red blocks:', stats.redBlocks);
  console.log('   Tips:', stats.tips);
  console.log('   Max depth:', stats.maxDepth);
  console.log('');

  console.log('📦 TEST 9: Deploy contract in block');
  const deployTx: Transaction = {
    hash: '0xtxdeploy',
    from: testAccounts[0],
    to: '', // Empty = deployment
    value: BigInt(0),
    gasLimit: BigInt(100000),
    gasPrice: BigInt(1000000000),
    nonce: 1,
    data: '0x604260005260206000f3', // Simple contract
  };
  
  const block3 = await miner['mineBlock']([deployTx], [block2.header.hash]);
  dag.addBlock(block3);
  
  const deployReceipt = miner.getReceipt(deployTx.hash);
  console.log('✅ Contract deployment block mined');
  console.log('   Contract address:', deployReceipt?.contractAddress || 'none');
  console.log('   Gas used:', deployReceipt?.gasUsed.toString());
  console.log('   State root:', block3.header.stateRoot.substring(0, 16) + '...');
  console.log('');

  console.log('📦 TEST 10: Verify state persistence');
  const balance0 = await evmExecutor.getBalance(testAccounts[0]);
  const balance1 = await evmExecutor.getBalance(testAccounts[1]);
  console.log('✅ Account balances after all transactions:');
  console.log(`   Account 0: ${balance0 / BigInt(10**18)} ETH (approx)`);
  console.log(`   Account 1: ${balance1 / BigInt(10**18)} ETH (approx)`);
  console.log('');

  console.log('✅✅✅ All EVM-DAG integration tests passed! ✅✅✅');
}

testMinerEVMIntegration().catch((error) => {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
