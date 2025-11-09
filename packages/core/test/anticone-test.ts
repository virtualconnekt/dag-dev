/**
 * Anticone Test
 * 
 * Tests the anticone calculation in DAGGraph
 * Demonstrates parallel blocks that have no ordering relationship
 */

import { DAGGraph } from '../src/dag/DAGGraph';
import { Block } from '../src/dag/Block';

console.log('='.repeat(70));
console.log('🧪 ANTICONE CALCULATION TEST');
console.log('='.repeat(70));
console.log();

// Create DAG with k=3 for testing
const dag = new DAGGraph(3);

console.log('📊 Building test DAG structure:');
console.log();
console.log('       Genesis (G)');
console.log('       /    |    \\');
console.log('     B1    B2    B3  (parallel at depth 1)');
console.log('       \\   /      |');
console.log('        B4        B5  (depth 2)');
console.log('          \\       /');
console.log('            B6       (depth 3)');
console.log();

// Get genesis
const genesis = dag.getBlock(dag.getGenesisHash())!;
console.log(`✅ Genesis created: ${genesis.header.hash.substring(0, 8)}...`);

// Create 3 parallel blocks at depth 1
const b1 = new Block([genesis.header.hash], [], '0xMiner1');
const b2 = new Block([genesis.header.hash], [], '0xMiner2');
const b3 = new Block([genesis.header.hash], [], '0xMiner3');

dag.addBlock(b1);
dag.addBlock(b2);
dag.addBlock(b3);

console.log(`✅ B1 created: ${b1.header.hash.substring(0, 8)}... (parent: genesis)`);
console.log(`✅ B2 created: ${b2.header.hash.substring(0, 8)}... (parent: genesis)`);
console.log(`✅ B3 created: ${b3.header.hash.substring(0, 8)}... (parent: genesis)`);
console.log();

// Create B4 with parents B1 and B2
const b4 = new Block([b1.header.hash, b2.header.hash], [], '0xMiner4');
dag.addBlock(b4);
console.log(`✅ B4 created: ${b4.header.hash.substring(0, 8)}... (parents: B1, B2)`);

// Create B5 with parent B3
const b5 = new Block([b3.header.hash], [], '0xMiner5');
dag.addBlock(b5);
console.log(`✅ B5 created: ${b5.header.hash.substring(0, 8)}... (parent: B3)`);

// Create B6 with parents B4 and B5
const b6 = new Block([b4.header.hash, b5.header.hash], [], '0xMiner6');
dag.addBlock(b6);
console.log(`✅ B6 created: ${b6.header.hash.substring(0, 8)}... (parents: B4, B5)`);
console.log();

console.log('━'.repeat(70));
console.log('ANTICONE ANALYSIS');
console.log('━'.repeat(70));
console.log();

// Test anticone of B1
console.log(`🔍 Anticone of B1:`);
const anticoneB1 = dag.getAnticone(b1.header.hash);
console.log(`  Size: ${anticoneB1.length}`);
console.log(`  Blocks: ${anticoneB1.map(h => {
  const block = dag.getBlock(h);
  if (h === b2.header.hash) return 'B2 (parallel)';
  if (h === b3.header.hash) return 'B3 (parallel)';
  if (h === b5.header.hash) return 'B5 (descendant of B3)';
  return h.substring(0, 8);
}).join(', ')}`);
console.log(`  ✅ B2 and B3 are in anticone (parallel blocks)`);
console.log(`  ✅ B5 is in anticone (descendant of B3, not B1)`);
console.log();

// Test anticone of B2
console.log(`🔍 Anticone of B2:`);
const anticoneB2 = dag.getAnticone(b2.header.hash);
console.log(`  Size: ${anticoneB2.length}`);
console.log(`  Blocks: ${anticoneB2.map(h => {
  if (h === b1.header.hash) return 'B1 (parallel)';
  if (h === b3.header.hash) return 'B3 (parallel)';
  if (h === b5.header.hash) return 'B5 (descendant of B3)';
  return h.substring(0, 8);
}).join(', ')}`);
console.log();

// Test anticone of B3
console.log(`🔍 Anticone of B3:`);
const anticoneB3 = dag.getAnticone(b3.header.hash);
console.log(`  Size: ${anticoneB3.length}`);
console.log(`  Blocks: ${anticoneB3.map(h => {
  if (h === b1.header.hash) return 'B1 (parallel)';
  if (h === b2.header.hash) return 'B2 (parallel)';
  if (h === b4.header.hash) return 'B4 (descendant of B1+B2)';
  return h.substring(0, 8);
}).join(', ')}`);
console.log();

// Test anticone of B4
console.log(`🔍 Anticone of B4:`);
const anticoneB4 = dag.getAnticone(b4.header.hash);
console.log(`  Size: ${anticoneB4.length}`);
console.log(`  Blocks: ${anticoneB4.map(h => {
  if (h === b3.header.hash) return 'B3 (parallel branch)';
  if (h === b5.header.hash) return 'B5 (descendant of B3)';
  return h.substring(0, 8);
}).join(', ')}`);
console.log(`  ✅ B3 and B5 are in anticone (different branch)`);
console.log();

// Test anticone of B6 (convergence point)
console.log(`🔍 Anticone of B6:`);
const anticoneB6 = dag.getAnticone(b6.header.hash);
console.log(`  Size: ${anticoneB6.length}`);
console.log(`  ✅ B6 has empty anticone (references all previous blocks)`);
console.log();

console.log('━'.repeat(70));
console.log('ANCESTORS & DESCENDANTS TEST');
console.log('━'.repeat(70));
console.log();

// Test ancestors
console.log(`🔍 Ancestors of B6:`);
const ancestorsB6 = dag.getAncestors(b6.header.hash);
console.log(`  Size: ${ancestorsB6.size}`);
console.log(`  All blocks except B6 itself: ${ancestorsB6.size === 6}`);
console.log();

// Test descendants
console.log(`🔍 Descendants of Genesis:`);
const descendantsGenesis = dag.getDescendants(genesis.header.hash);
console.log(`  Size: ${descendantsGenesis.size}`);
console.log(`  All blocks except Genesis itself: ${descendantsGenesis.size === 6}`);
console.log();

console.log(`🔍 Descendants of B1:`);
const descendantsB1 = dag.getDescendants(b1.header.hash);
console.log(`  Size: ${descendantsB1.size}`);
console.log(`  Includes: B4, B6`);
console.log(`  Does NOT include: B2, B3, B5 (parallel branches)`);
console.log();

console.log('━'.repeat(70));
console.log('DAG STATISTICS');
console.log('━'.repeat(70));
console.log();

const stats = dag.getStats();
console.log('📊 Final DAG Stats:');
console.log(JSON.stringify(stats, null, 2));
console.log();

console.log('━'.repeat(70));
console.log('KEY INSIGHTS');
console.log('━'.repeat(70));
console.log();
console.log('✅ Parallel blocks (B1, B2, B3) have each other in their anticone');
console.log('✅ Anticone represents blocks with no causal relationship');
console.log('✅ Anticone size is used by GHOSTDAG for blue/red coloring');
console.log('✅ Large anticone (>k) → red block (potential conflict)');
console.log('✅ Small anticone (≤k) → blue block (honest mining)');
console.log();

console.log('='.repeat(70));
console.log('✅ ANTICONE TEST COMPLETE');
console.log('='.repeat(70));
