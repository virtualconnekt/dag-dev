/**
 * run-tests.ts
 * 
 * Script to run tests using DagTestRunner
 * This will be called by the CLI `dagdev test` command
 * 
 * NOTE: The test runner uses ports 18545 and 18546 (not 8545/8546)
 * This allows you to run tests while your local node is running on 8545/8546
 */

import { DagTestRunner } from './src/DagTestRunner';
import { dagMatchers, setGlobalNode } from './src/matchers/dagMatchers';
import { use } from 'chai';
import * as path from 'path';
import * as fs from 'fs';

// Register DAG matchers globally
use(dagMatchers);

async function main() {
  const args = process.argv.slice(2);
  const testPattern = args[0] || 'test/**/*.test.ts';

  console.log('🧪 DagDev Test Runner\n');
  console.log('💡 Test node will run on ports 18545/18546 (separate from main node)\n');

  const runner = new DagTestRunner({
    timeout: 15000, // 15 second timeout
    k: 18,
    port: 18545,    // Test RPC port (different from main node's 8545)
    wsPort: 18546,  // Test WebSocket port (different from main node's 8546)
    miningConfig: {
      blockTime: 500,  // Fast mining for tests
      parallelism: 2,
    }
  });

  // Find test files
  const testFiles: string[] = [];
  
  if (testPattern.includes('*')) {
    // Handle glob patterns (simple implementation)
    const dir = path.dirname(testPattern);
    const pattern = path.basename(testPattern);
    
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.test.ts') || file.endsWith('-test.ts')) {
          testFiles.push(path.join(dir, file));
        }
      });
    }
  } else {
    // Single file
    if (fs.existsSync(testPattern)) {
      testFiles.push(testPattern);
    }
  }

  if (testFiles.length === 0) {
    console.log('⚠️  No test files found\n');
    console.log(`Looked in: ${testPattern}\n`);
    process.exit(1);
  }

  console.log(`📋 Found ${testFiles.length} test file(s):\n`);
  testFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // Add test files
  testFiles.forEach(file => {
    runner.addFile(path.resolve(file));
  });

  // Run tests
  const failures = await runner.run();

  // Exit with appropriate code
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  console.error(error.stack);
  process.exit(1);
});
