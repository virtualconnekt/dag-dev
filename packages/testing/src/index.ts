/**
 * index.ts
 * 
 * Main entry point for @dagdev/testing package.
 * Exports testing utilities and custom matchers.
 * 
 * @phase Phase 5 - Testing Framework
 */

export { DagTestRunner, TestRunnerConfig } from './DagTestRunner';
export { dagMatchers, setGlobalNode } from './matchers/dagMatchers';

// Test fixtures
// export * from './fixtures/accounts';

// Re-export Chai for convenience
export { expect, use } from 'chai';
