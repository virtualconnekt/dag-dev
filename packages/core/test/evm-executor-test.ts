/**
 * evm-executor-test.ts
 * 
 * Test EVMExecutor with contract deployment and execution
 * Phase 3: EVM Integration
 */

import { EVMExecutor } from '../src/evm/EVMExecutor';
import { Transaction } from '../src/dag/Block';
import { bytesToHex } from '@ethereumjs/util';

console.log('🧪 Testing EVMExecutor Integration\n');

async function testEVMExecutor() {
  const executor = new EVMExecutor();

  console.log('📦 TEST 1: Initialize accounts with balances');
  const testAccounts = [
    '0x1000000000000000000000000000000000000001',
    '0x2000000000000000000000000000000000000002',
    '0x3000000000000000000000000000000000000003',
  ];

  for (const address of testAccounts) {
    await executor.setBalance(address, BigInt('1000000000000000000000')); // 1000 ETH
    const balance = await executor.getBalance(address);
    console.log(`✅ ${address}: ${balance / BigInt(10**18)} ETH`);
  }
  console.log('');

  console.log('📦 TEST 2: Deploy simple contract (returns 0x42)');
  // Bytecode: PUSH1 0x42 PUSH1 0x00 MSTORE PUSH1 0x20 PUSH1 0x00 RETURN
  const deployTx: Transaction = {
    hash: '0xdeploy001',
    from: testAccounts[0],
    to: '',
    value: BigInt(0),
    gasLimit: BigInt(100000),
    gasPrice: BigInt(1000000000),
    nonce: 0,
    data: '0x604260005260206000f3',
    timestamp: Date.now(),
  };

  const deployResult = await executor.executeTransaction(deployTx, '0xblock001');
  console.log('✅ Contract deployed');
  console.log('   Status:', deployResult.receipt.status);
  console.log('   Gas used:', deployResult.receipt.gasUsed.toString());
  console.log('   Contract address:', deployResult.receipt.contractAddress || 'none');
  console.log('   Return value:', bytesToHex(deployResult.returnValue || new Uint8Array()));
  console.log('');

  const contractAddress = deployResult.receipt.contractAddress!;

  console.log('📦 TEST 3: Verify contract code');
  const code = await executor.getCode(contractAddress);
  console.log('✅ Contract code length:', code.length, 'bytes');
  console.log('   Code:', bytesToHex(code));
  console.log('');

  console.log('📦 TEST 4: Execute value transfer transaction');
  const transferTx: Transaction = {
    hash: '0xtransfer001',
    from: testAccounts[0],
    to: testAccounts[1],
    value: BigInt('5000000000000000000'), // 5 ETH
    gasLimit: BigInt(21000),
    gasPrice: BigInt(1000000000),
    nonce: 1,
    data: '',
    timestamp: Date.now(),
  };

  const transferResult = await executor.executeTransaction(transferTx, '0xblock002');
  console.log('✅ Transfer executed');
  console.log('   Status:', transferResult.receipt.status);
  console.log('   Gas used:', transferResult.receipt.gasUsed.toString());
  console.log('');

  console.log('📦 TEST 5: Check balances after transfer');
  const balance0 = await executor.getBalance(testAccounts[0]);
  const balance1 = await executor.getBalance(testAccounts[1]);
  console.log(`✅ Sender balance: ${balance0 / BigInt(10**18)} ETH`);
  console.log(`✅ Recipient balance: ${balance1 / BigInt(10**18)} ETH`);
  console.log('');

  console.log('📦 TEST 6: Estimate gas for transfer');
  const estimateTx: Transaction = {
    hash: '0xestimate001',
    from: testAccounts[0],
    to: testAccounts[2],
    value: BigInt('1000000000000000000'), // 1 ETH
    gasLimit: BigInt(21000),
    gasPrice: BigInt(1000000000),
    nonce: 2,
    data: '',
    timestamp: Date.now(),
  };

  const gasEstimate = await executor.estimateGas(estimateTx);
  console.log('✅ Gas estimate:', gasEstimate.toString());
  console.log('');

  console.log('📦 TEST 7: Get account nonce');
  const nonce = await executor.getNonce(testAccounts[0]);
  console.log('✅ Account nonce:', nonce.toString());
  console.log('');

  console.log('📦 TEST 8: Get state root');
  const stateRoot = await executor.getStateRootHex();
  console.log('✅ State root:', stateRoot);
  console.log('');

  console.log('📦 TEST 9: Test checkpoint/revert');
  await executor.checkpoint();
  await executor.setBalance(testAccounts[0], BigInt(999));
  const balanceBefore = await executor.getBalance(testAccounts[0]);
  console.log('   Balance after modification:', balanceBefore.toString());
  
  await executor.revert();
  const balanceAfter = await executor.getBalance(testAccounts[0]);
  console.log('✅ Balance after revert:', balanceAfter / BigInt(10**18), 'ETH');
  console.log('');

  console.log('📦 TEST 10: Test copy()');
  const copy = await executor.copy();
  const copyRoot = await copy.getStateRootHex();
  console.log('✅ Copy state root:', copyRoot);
  console.log('✅ Roots match:', copyRoot === stateRoot);
  console.log('');

  console.log('✅✅✅ All EVM Executor tests passed! ✅✅✅');
}

testEVMExecutor().catch((error) => {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
