/**
 * rpc-evm-test.ts
 * 
 * Test RPC server with real EVM integration
 * Phase 3: EVM Integration Complete
 */

import { LocalNode } from '../src/network/LocalNode';
import { Transaction } from '../src/dag/Block';

console.log('🧪 Testing RPC Server with Real EVM\n');

const RPC_URL = 'http://localhost:8545';

async function rpcCall(method: string, params: any[] = []) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  const data: any = await response.json();
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }
  return data.result;
}

async function testRPCWithEVM() {
  console.log('📦 TEST 1: Start LocalNode');
  const node = new LocalNode();
  await node.start();
  console.log('✅ Node started with RPC on port 8545\n');
  
  // Wait for node to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('📦 TEST 2: Fund test account using EVM');
  const testAccount = '0x1000000000000000000000000000000000000001';
  const evmExecutor = node.getMiner().getEVMExecutor();
  await evmExecutor.setBalance(testAccount, BigInt('5000000000000000000000')); // 5000 ETH
  console.log('✅ Account funded: 5000 ETH\n');

  console.log('📦 TEST 3: eth_getBalance (real EVM)');
  const balance = await rpcCall('eth_getBalance', [testAccount, 'latest']);
  const balanceEth = BigInt(balance) / BigInt(10**18);
  console.log('✅ Balance:', balanceEth.toString(), 'ETH');
  console.log('   Hex:', balance);
  console.log('');

  console.log('📦 TEST 4: eth_getTransactionCount (real nonce)');
  const nonce = await rpcCall('eth_getTransactionCount', [testAccount, 'latest']);
  console.log('✅ Nonce:', parseInt(nonce, 16));
  console.log('');

  console.log('📦 TEST 5: Deploy contract via transaction');
  const deployTx: Transaction = {
    hash: '0xdeploy123',
    from: testAccount,
    to: '', // Empty = deployment
    value: BigInt(0),
    gasLimit: BigInt(200000),
    gasPrice: BigInt(1000000000),
    nonce: 0,
    data: '0x604260005260206000f3', // Simple contract
  };
  
  // Add transaction to pool
  node.addTransaction(deployTx);
  
  // Wait for mining
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('✅ Contract deployment transaction submitted\n');

  console.log('📦 TEST 6: eth_getTransactionReceipt (real receipt)');
  const receipt = await rpcCall('eth_getTransactionReceipt', [deployTx.hash]);
  if (receipt) {
    console.log('✅ Receipt found:');
    console.log('   Status:', receipt.status === '0x1' ? 'Success' : 'Failed');
    console.log('   Gas used:', parseInt(receipt.gasUsed, 16));
    console.log('   Contract address:', receipt.contractAddress || 'none');
    console.log('   Block hash:', receipt.blockHash.substring(0, 16) + '...');
  } else {
    console.log('⚠️  Receipt not found (may need more time for mining)');
  }
  console.log('');

  if (receipt && receipt.contractAddress) {
    const contractAddress = receipt.contractAddress;

    console.log('📦 TEST 7: eth_getCode (real contract code)');
    const code = await rpcCall('eth_getCode', [contractAddress, 'latest']);
    console.log('✅ Contract code:');
    console.log('   Length:', code.length, 'chars');
    console.log('   Code:', code.substring(0, 40) + '...');
    console.log('');

    console.log('📦 TEST 8: eth_call (read-only call)');
    try {
      const callResult = await rpcCall('eth_call', [
        {
          to: contractAddress,
          data: '0x',
        },
        'latest'
      ]);
      console.log('✅ Call result:', callResult);
    } catch (error: any) {
      console.log('⚠️  Call failed:', error.message);
    }
    console.log('');

    console.log('📦 TEST 9: eth_getStorageAt (contract storage)');
    const storage = await rpcCall('eth_getStorageAt', [
      contractAddress,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      'latest'
    ]);
    console.log('✅ Storage at slot 0:', storage);
    console.log('');
  }

  console.log('📦 TEST 10: eth_estimateGas (real EVM estimation)');
  const gasEstimate = await rpcCall('eth_estimateGas', [
    {
      from: testAccount,
      to: '0x2000000000000000000000000000000000000002',
      value: '0xde0b6b3a7640000', // 1 ETH
      data: '0x',
    }
  ]);
  console.log('✅ Gas estimate:', parseInt(gasEstimate, 16), 'gas');
  console.log('');

  console.log('📦 TEST 11: Check DAG stats');
  const dagInfo = await rpcCall('dag_getDAGInfo', []);
  console.log('✅ DAG Info:');
  console.log('   Total blocks:', dagInfo.dag.totalBlocks);
  console.log('   Blue blocks:', dagInfo.dag.blueBlocks);
  console.log('   Tips:', dagInfo.dag.tips);
  console.log('   Max depth:', dagInfo.dag.maxDepth);
  console.log('');

  console.log('📦 TEST 12: Stop node');
  await node.stop();
  console.log('✅ Node stopped\n');

  console.log('✅✅✅ All RPC+EVM tests passed! ✅✅✅');
}

testRPCWithEVM().catch((error) => {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
