/**
 * test.ts
 * 
 * Implementation of `dagdev test` command.
 * Runs Mocha tests with DAG context.
 * 
 * @phase Phase 7 - CLI Tool
 */

import { DagTestRunner } from '@dagdev/testing';
import { dagMatchers } from '@dagdev/testing';
import { use } from 'chai';
import * as path from 'path';
import * as fs from 'fs';

// Register DAG matchers
use(dagMatchers);

export async function testCommand(files: string[]): Promise<void> {
  console.log('🧪 Running DagDev tests...\n');

  // Find test files
  const testFiles = files.length > 0 
    ? files 
    : findTestFiles('./test');

  if (testFiles.length === 0) {
    console.log('⚠️  No test files found in ./test directory');
    console.log('💡 Create tests in ./test directory or specify files: dagdev test <files>');
    return;
  }

  console.log(`📋 Found ${testFiles.length} test file(s):\n`);
  testFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // Create test runner with DAG configuration
  const runner = new DagTestRunner({
    timeout: 15000,
    k: 18,
    miningConfig: {
      blockTime: 500,  // Fast mining for tests
      parallelism: 2,
    }
  });
  
  // Add test files
  for (const file of testFiles) {
    const absolutePath = path.resolve(file);
    if (fs.existsSync(absolutePath)) {
      runner.addFile(absolutePath);
    } else {
      console.warn(`⚠️  File not found: ${file}`);
    }
  }

  // Run tests
  try {
    const failures = await runner.run();

    if (failures > 0) {
      console.log(`\n❌ ${failures} test(s) failed\n`);
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
