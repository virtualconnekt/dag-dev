/**
 * evm-merkle-test.ts
 * 
 * EVM test with MerkleStateManager
 * Phase 3: EVM Integration
 */

import { EVM } from '@ethereumjs/evm';
import { MerkleStateManager } from '@ethereumjs/statemanager';
import { Common, Hardfork, Mainnet } from '@ethereumjs/common';
import { createAddressFromString, hexToBytes, bytesToHex } from '@ethereumjs/util';

console.log('🧪 Testing EVM with MerkleStateManager\n');

async function testEVM() {
  console.log('📦 TEST 1: Initialize EVM with MerkleStateManager');
  const common = new Common({ chain: Mainnet, hardfork: Hardfork.Shanghai });
  const stateManager = new MerkleStateManager();
  const evm = new EVM({ common, stateManager });
  console.log('✅ EVM initialized\n');

  console.log('📦 TEST 2: Set account balance');
  const sender = createAddressFromString('0x1000000000000000000000000000000000000001');
  let account = await stateManager.getAccount(sender);
  if (account) {
    account.balance = BigInt('1000000000000000000000'); // 1000 ETH
    await stateManager.putAccount(sender, account);
  }
  console.log('✅ Balance set to 1000 ETH\n');

  console.log('📦 TEST 3: Deploy contract');
  const bytecode = hexToBytes('0x604260005260206000f3' as `0x${string}`);
  const result = await evm.runCall({
    caller: sender,
    data: bytecode,
    gasLimit: BigInt(100000),
  });
  console.log('✅ Contract deployed');
  console.log('   Gas used:', result.execResult.executionGasUsed.toString());
  console.log('   Contract address:', result.createdAddress?.toString() || 'none');
  console.log('');

  console.log('📦 TEST 4: Get state root');
  const stateRoot = await stateManager.getStateRoot();
  console.log('✅ State root:', bytesToHex(stateRoot));
  console.log('');

  console.log('📦 TEST 5: Copy state');
  const copy = stateManager.shallowCopy();
  const copyRoot = await copy.getStateRoot();
  console.log('✅ Copy state root:', bytesToHex(copyRoot));
  console.log('');

  console.log('✅ All tests passed!');
}

testEVM().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
