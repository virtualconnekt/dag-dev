/**
 * evm-test.ts
 * 
 * Test EVM integration with BlockDAG
 * 
 * Phase 3: EVM Integration
 */

console.log('🧪 Testing EVM Integration\n');

// Test imports
async function testImports() {
  try {
    console.log('📦 Testing imports...');
    
    const { EVM } = await import('@ethereumjs/evm');
    console.log('✅ EVM imported');
    
    const { Common, Hardfork, Mainnet } = await import('@ethereumjs/common');
    console.log('✅ Common imported');
    
    const stateManagerModule = await import('@ethereumjs/statemanager');
    console.log('✅ StateManager module:', Object.keys(stateManagerModule));
    
    const utilModule = await import('@ethereumjs/util');
    console.log('✅ Util module:', Object.keys(utilModule).slice(0, 10), '...');
    
    // Check Address methods
    console.log('\n🔍 Address methods:', Object.getOwnPropertyNames(utilModule.Address).slice(0, 10));
    
    // Try to create EVM
    const common = new Common({ chain: Mainnet, hardfork: Hardfork.Shanghai });
    console.log('\n✅ Common created:', common.chainName());
    
  } catch (error: any) {
    console.error('❌ Import error:', error.message);
  }
}

testImports().catch(console.error);
