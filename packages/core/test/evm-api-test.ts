/**
 * evm-api-test.ts
 * 
 * Test EVM API details
 */

async function testAPI() {
  const { Address } = await import('@ethereumjs/util');
  const { SimpleStateManager } = await import('@ethereumjs/statemanager');
  
  console.log('🔍 Address prototype methods:');
  console.log(Object.getOwnPropertyNames(Address.prototype));
  
  console.log('\n🔍 Address static methods:');
  console.log(Object.getOwnPropertyNames(Address));
  
  // Try creating an address
  console.log('\n✅ Creating address from hex string...');
  const testAddr = '0x1234567890123456789012345678901234567890';
  
  // Try different methods to create Address
  try {
    const addr = Address.fromString(testAddr);
    console.log('✅ Address.fromString works:', addr.toString());
  } catch (e: any) {
    console.log('❌ Address.fromString:', e.message);
  }
  
  try {
    const addrBytes = Buffer.from(testAddr.slice(2), 'hex');
    const addr = new Address(addrBytes);
    console.log('✅ new Address(bytes) works:', addr.toString());
  } catch (e: any) {
    console.log('❌ new Address:', e.message);
  }
  
  console.log('\n🔍 SimpleStateManager prototype:');
  console.log(Object.getOwnPropertyNames(SimpleStateManager.prototype));
}

testAPI().catch(console.error);
