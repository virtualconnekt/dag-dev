/**
 * Test the ConfigLoader
 */

import { ConfigLoader } from '../src/ConfigLoader';
import * as path from 'path';

async function testConfigLoader() {
  console.log('🧪 Testing ConfigLoader\n');

  try {
    // Test 1: Load config from root
    console.log('Test 1: Load config from project root');
    const projectRoot = path.resolve(__dirname, '../../..');
    const config = await ConfigLoader.load(projectRoot);
    
    console.log('\nLoaded configuration:');
    console.log('- Networks:', Object.keys(config.networks).join(', '));
    console.log('- Default network:', config.defaultNetwork);
    console.log('- DAG k parameter:', config.dag.k);
    console.log('- DAG parallelism:', config.dag.parallelism);
    console.log('- Solidity version:', typeof config.solidity === 'string' ? config.solidity : config.solidity.version);
    console.log('- Sources path:', config.paths?.sources);
    
    // Test 2: Get network config
    console.log('\nTest 2: Get network configuration');
    const localNetwork = ConfigLoader.getNetwork(config, 'local');
    console.log('- Local network URL:', localNetwork.url);
    console.log('- Local network chainId:', localNetwork.chainId);
    
    // Test 3: Validate config
    console.log('\nTest 3: Validate configuration');
    ConfigLoader['validateConfig'](config);
    console.log('✅ Configuration is valid');
    
    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConfigLoader();
