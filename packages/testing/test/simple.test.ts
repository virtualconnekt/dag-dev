/**
 * simple-test.ts
 * 
 * Simple test to verify the testing framework works
 */

import { expect, use } from 'chai';
import { dagMatchers, setGlobalNode } from '../src';

// Register DAG matchers
use(dagMatchers);

// Access global dagdev runtime
declare global {
  var dagdev: any;
  var dagNode: any;
}

describe('Simple Test', function() {
  this.timeout(5000);

  before(function() {
    console.log('Setting up...');
    setGlobalNode(dagNode);
  });

  it('should have dagdev runtime', function() {
    expect(dagdev).to.not.be.undefined;
    expect(dagdev.dag).to.not.be.undefined;
    expect(dagdev.evm).to.not.be.undefined;
    expect(dagdev.mining).to.not.be.undefined;
    console.log('✅ Runtime available');
  });

  it('should get DAG depth', async function() {
    const depth = await dagdev.dag.getDepth();
    expect(depth).to.be.a('number');
    console.log(`   DAG depth: ${depth}`);
  });

  it('should get genesis block', async function() {
    const genesis = await dagdev.dag.getGenesis();
    expect(genesis).to.not.be.null;
    expect(genesis.header).to.not.be.undefined;
    console.log(`   Genesis: ${genesis.header.hash.substring(0, 10)}...`);
  });
});
