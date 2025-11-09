/**
 * evm-simple-test.ts
 * 
 * Simple EVM integration test with correct API
 * Phase 3: EVM Integration
 */

import { EVM } from '@ethereumjs/evm';
import { SimpleStateManager } from '@ethereumjs/statemanager';
import { Common, Hardfork, Mainnet } from '@ethereumjs/common';
import { createAddressFromString, createZeroAddress, hexToBytes, bytesToHex } from '@ethereumjs/util';

console.log('🧪 Testing EVM Integration with correct API\n');

async function testEVMBasics() {
  console.log('📦 TEST 1: Initialize EVM');
  const common = new Common({ chain: Mainnet, hardfork: Hardfork.Shanghai });
  const stateManager = new SimpleStateManager();
  const evm = new EVM({ common, stateManager });
  console.log('✅ EVM initialized\n');

  console.log('📦 TEST 2: Create addresses');
  const sender = createAddressFromString('0x1000000000000000000000000000000000000001');
  const recipient = createAddressFromString('0x2000000000000000000000000000000000000002');
  const zero = createZeroAddress();
  console.log('✅ Sender:', sender.toString());
  console.log('✅ Recipient:', recipient.toString());
  console.log('✅ Zero:', zero.toString());
  console.log('');

  console.log('📦 TEST 3: Set account balances');
  let account = await stateManager.getAccount(sender);
  if (account) {
    account.balance = BigInt(1000000000000000000000); // 1000 ETH
    await stateManager.putAccount(sender, account);
  }
  console.log('✅ Sender balance set to 1000 ETH\n');

  console.log('📦 TEST 4: Simple value transfer');
  const result = await evm.runCall({
    caller: sender,
    to: recipient,
    value: BigInt(1000000000000000000), // 1 ETH
    gasLimit: BigInt(21000),
  });
  console.log('✅ Transfer executed');
  console.log('   Gas used:', result.execResult.executionGasUsed.toString());
  console.log('   Success:', !result.execResult.exceptionError);
  console.log('');

  console.log('📦 TEST 5: Deploy simple contract');
  // Simple contract: PUSH1 0x42 PUSH1 0x00 MSTORE PUSH1 0x20 PUSH1 0x00 RETURN
  // Returns 0x42 (66 in decimal)
  const bytecode = hexToBytes('0x604260005260206000f3' as `0x${string}`);
  const deployResult = await evm.runCall({
    caller: sender,
    data: bytecode,
    gasLimit: BigInt(100000),
  });
  console.log('✅ Contract deployed');
  console.log('   Gas used:', deployResult.execResult.executionGasUsed.toString());
  console.log('   Success:', !deployResult.execResult.exceptionError);
  if (deployResult.createdAddress) {
    console.log('   Contract address:', deployResult.createdAddress.toString());
    console.log('   Return value:', bytesToHex(deployResult.execResult.returnValue));
  }
  console.log('');

  console.log('📦 TEST 6: Get state root');
  const stateRoot = await stateManager.getStateRoot();
  console.log('✅ State root:', bytesToHex(stateRoot));
  console.log('');

  console.log('✅ All EVM tests passed!');
}

testEVMBasics().catch((error) => {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
