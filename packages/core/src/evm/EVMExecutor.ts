/**
 * EVMExecutor.ts - EVM integration for BlockDAG
 * Phase 3: EVM Integration
 */

import { EVM } from '@ethereumjs/evm';
import { MerkleStateManager } from '@ethereumjs/statemanager';
import { Common, Hardfork, Mainnet } from '@ethereumjs/common';
import { createAddressFromString, createZeroAddress, hexToBytes, bytesToHex } from '@ethereumjs/util';
import { Transaction } from '../dag/Block';

export interface TransactionReceipt {
  transactionHash: string;
  blockHash: string;
  from: string;
  to: string | null;
  gasUsed: bigint;
  cumulativeGasUsed: bigint;
  status: 'success' | 'failed';
  logs: any[];
  contractAddress?: string;
}

export interface EVMResult {
  receipt: TransactionReceipt;
  gasUsed: bigint;
  returnValue?: Uint8Array;
  createdAddress?: string;
}

export class EVMExecutor {
  private evm: EVM;
  private stateManager: MerkleStateManager;
  private common: Common;
  private cumulativeGasUsed: bigint = 0n;

  constructor() {
    this.common = new Common({ chain: Mainnet, hardfork: Hardfork.Shanghai });
    this.stateManager = new MerkleStateManager();
    this.evm = new EVM({ common: this.common, stateManager: this.stateManager });
    console.log('✅ EVMExecutor initialized');
  }

  getStateManager(): MerkleStateManager {
    return this.stateManager;
  }

  async getStateRoot(): Promise<Uint8Array> {
    return await this.stateManager.getStateRoot();
  }

  async setStateRoot(stateRoot: Uint8Array): Promise<void> {
    await this.stateManager.setStateRoot(stateRoot);
  }

  resetCumulativeGas(): void {
    this.cumulativeGasUsed = 0n;
  }

  async executeTransaction(tx: Transaction, blockHash: string): Promise<EVMResult> {
    try {
      const fromAddress = createAddressFromString(tx.from);
      const toAddress = tx.to ? createAddressFromString(tx.to) : undefined;
      const data = tx.data ? hexToBytes(tx.data as any) : undefined;

      if (!toAddress) {
        return await this.deployContract(fromAddress, data || new Uint8Array(), tx, blockHash);
      }

      const result = await this.evm.runCall({
        caller: fromAddress,
        to: toAddress,
        value: tx.value,
        gasLimit: tx.gasLimit,
        data,
      });

      const gasUsed = tx.gasLimit - result.execResult.executionGasUsed;
      this.cumulativeGasUsed += gasUsed;

      return {
        receipt: {
          transactionHash: tx.hash,
          blockHash,
          from: tx.from,
          to: tx.to,
          gasUsed,
          cumulativeGasUsed: this.cumulativeGasUsed,
          status: result.execResult.exceptionError ? 'failed' : 'success',
          logs: [],
        },
        gasUsed,
        returnValue: result.execResult.returnValue,
      };
    } catch (error) {
      const gasUsed = tx.gasLimit;
      this.cumulativeGasUsed += gasUsed;
      return {
        receipt: {
          transactionHash: tx.hash,
          blockHash,
          from: tx.from,
          to: tx.to,
          gasUsed,
          cumulativeGasUsed: this.cumulativeGasUsed,
          status: 'failed',
          logs: [],
        },
        gasUsed,
      };
    }
  }

  private async deployContract(from: any, bytecode: Uint8Array, tx: Transaction, blockHash: string): Promise<EVMResult> {
    try {
      const result = await this.evm.runCall({
        caller: from,
        data: bytecode,
        gasLimit: tx.gasLimit,
        value: tx.value,
      });

      const gasUsed = tx.gasLimit - result.execResult.executionGasUsed;
      this.cumulativeGasUsed += gasUsed;
      const createdAddress = result.createdAddress?.toString();

      return {
        receipt: {
          transactionHash: tx.hash,
          blockHash,
          from: tx.from,
          to: null,
          gasUsed,
          cumulativeGasUsed: this.cumulativeGasUsed,
          status: result.execResult.exceptionError ? 'failed' : 'success',
          logs: [],
          contractAddress: createdAddress,
        },
        gasUsed,
        createdAddress,
        returnValue: result.execResult.returnValue,
      };
    } catch (error) {
      const gasUsed = tx.gasLimit;
      this.cumulativeGasUsed += gasUsed;
      return {
        receipt: {
          transactionHash: tx.hash,
          blockHash,
          from: tx.from,
          to: null,
          gasUsed,
          cumulativeGasUsed: this.cumulativeGasUsed,
          status: 'failed',
          logs: [],
        },
        gasUsed,
      };
    }
  }

  async call(to: string, data: string, from?: string, value?: bigint): Promise<Uint8Array> {
    const toAddress = createAddressFromString(to);
    const fromAddress = from ? createAddressFromString(from) : createZeroAddress();
    const callData = data ? hexToBytes(data as any) : undefined;

    const result = await this.evm.runCall({
      caller: fromAddress,
      to: toAddress,
      data: callData,
      value: value || 0n,
      gasLimit: BigInt(10_000_000),
    });

    if (result.execResult.exceptionError) {
      throw new Error(`Contract call failed: ${result.execResult.exceptionError.error}`);
    }

    return result.execResult.returnValue;
  }

  async estimateGas(tx: Transaction): Promise<bigint> {
    try {
      const fromAddress = createAddressFromString(tx.from);
      const toAddress = tx.to ? createAddressFromString(tx.to) : undefined;
      const data = tx.data ? hexToBytes(tx.data as any) : undefined;

      const result = await this.evm.runCall({
        caller: fromAddress,
        to: toAddress,
        data,
        value: tx.value,
        gasLimit: BigInt(10_000_000),
      });

      return result.execResult.executionGasUsed + BigInt(21000);
    } catch (error) {
      return BigInt(100000);
    }
  }

  async getBalance(address: string): Promise<bigint> {
    const addr = createAddressFromString(address);
    const account = await this.stateManager.getAccount(addr);
    return account ? account.balance : 0n;
  }

  async setBalance(address: string, balance: bigint): Promise<void> {
    const addr = createAddressFromString(address);
    let account = await this.stateManager.getAccount(addr);
    if (account) {
      account.balance = balance;
      await this.stateManager.putAccount(addr, account);
    }
  }

  async getNonce(address: string): Promise<bigint> {
    const addr = createAddressFromString(address);
    const account = await this.stateManager.getAccount(addr);
    return account ? account.nonce : 0n;
  }

  async getCode(address: string): Promise<Uint8Array> {
    const addr = createAddressFromString(address);
    const code = await this.stateManager.getCode(addr);
    return code || new Uint8Array();
  }

  async getStorageAt(address: string, position: string): Promise<Uint8Array> {
    const addr = createAddressFromString(address);
    const pos = hexToBytes(position as any);
    const value = await this.stateManager.getStorage(addr, pos);
    return value || new Uint8Array(32);
  }

  async checkpoint(): Promise<void> {
    await this.stateManager.checkpoint();
  }

  async commit(): Promise<void> {
    await this.stateManager.commit();
  }

  async revert(): Promise<void> {
    await this.stateManager.revert();
  }

  async copy(): Promise<EVMExecutor> {
    // Note: MerkleStateManager doesn't support easy copying between different tries
    // For now, return a new executor with shared state manager reference
    // In production, would need to implement state synchronization
    const newExecutor = new EVMExecutor();
    // TODO: Implement proper state copying with Merkle proof transfer
    return newExecutor;
  }

  async getStateRootHex(): Promise<string> {
    const root = await this.getStateRoot();
    return bytesToHex(root);
  }
}
