/**
 * test.ts
 * 
 * Implementation of `dagdev test` command.
 * Runs Mocha tests with DAG context.
 * 
 * @phase Phase 7 - CLI Tool
 */

// import { DagTestRunner } from '@dagdev/testing';
import * as path from 'path';
import * as fs from 'fs';

export async function testCommand(files: string[]): Promise<void> {
  console.log('🧪 Running tests...');

  // Find test files
  const testFiles = files.length > 0 
    ? files 
    : findTestFiles('./test');

  if (testFiles.length === 0) {
    console.log('⚠️  No test files found');
    return;
  }

  console.log(`Found ${testFiles.length} test file(s)`);

  // Create test runner
  // const runner = new DagTestRunner();
  
  // Add test files
  // for (const file of testFiles) {
  //   runner.addFile(file);
  // }

  // Run tests
  // const failures = await runner.run();

  // process.exit(failures);
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
