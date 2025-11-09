/**
 * StateManager.ts
 * 
 * Manages EVM world state on the BlockDAG.
 * Handles account balances, nonces, contract storage, and code.
 * 
 * In a DAG, state management is more complex than linear blockchain:
 * - Multiple parallel blocks may modify state
 * - Must follow blue set for canonical state
 * - Red blocks don't affect state
 * 
 * Uses Merkle Patricia Trie for state storage.
 * 
 * @phase Phase 3 - EVM Integration
 */

export interface Account {
  address: string;
  balance: bigint;
  nonce: number;
  codeHash: string;
  storageRoot: string;
}

export class StateManager {
  private accounts: Map<string, Account>;
  private contractCode: Map<string, string>;    // codeHash -> bytecode
  private contractStorage: Map<string, Map<string, string>>;  // address -> storage

  constructor() {
    this.accounts = new Map();
    this.contractCode = new Map();
    this.contractStorage = new Map();
    
    // Initialize with some test accounts
    this.initializeTestAccounts();
  }

  /**
   * Initialize test accounts with balances
   */
  private initializeTestAccounts(): void {
    const testAccounts = [
      '0x0000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000003',
    ];

    for (const address of testAccounts) {
      this.accounts.set(address, {
        address,
        balance: BigInt('1000000000000000000000'), // 1000 ETH
        nonce: 0,
        codeHash: '0x',
        storageRoot: '0x',
      });
    }
  }

  /**
   * Get account
   */
  getAccount(address: string): Account | undefined {
    return this.accounts.get(address);
  }

  /**
   * Create new account
   */
  createAccount(address: string): Account {
    const account: Account = {
      address,
      balance: BigInt(0),
      nonce: 0,
      codeHash: '0x',
      storageRoot: '0x',
    };
    
    this.accounts.set(address, account);
    return account;
  }

  /**
   * Get account balance
   */
  getBalance(address: string): bigint {
    const account = this.accounts.get(address);
    return account?.balance || BigInt(0);
  }

  /**
   * Set account balance
   */
  setBalance(address: string, balance: bigint): void {
    let account = this.accounts.get(address);
    
    if (!account) {
      account = this.createAccount(address);
    }
    
    account.balance = balance;
  }

  /**
   * Get account nonce
   */
  getNonce(address: string): number {
    const account = this.accounts.get(address);
    return account?.nonce || 0;
  }

  /**
   * Increment account nonce
   */
  incrementNonce(address: string): void {
    let account = this.accounts.get(address);
    
    if (!account) {
      account = this.createAccount(address);
    }
    
    account.nonce++;
  }

  /**
   * Store contract code
   */
  putContractCode(address: string, code: string): void {
    const codeHash = this.hashCode(code);
    
    let account = this.accounts.get(address);
    if (!account) {
      account = this.createAccount(address);
    }
    
    account.codeHash = codeHash;
    this.contractCode.set(codeHash, code);
  }

  /**
   * Get contract code
   */
  getContractCode(address: string): string {
    const account = this.accounts.get(address);
    if (!account || account.codeHash === '0x') {
      return '0x';
    }
    
    return this.contractCode.get(account.codeHash) || '0x';
  }

  /**
   * Set contract storage value
   */
  putContractStorage(address: string, key: string, value: string): void {
    let storage = this.contractStorage.get(address);
    
    if (!storage) {
      storage = new Map();
      this.contractStorage.set(address, storage);
    }
    
    storage.set(key, value);
  }

  /**
   * Get contract storage value
   */
  getContractStorage(address: string, key: string): string {
    const storage = this.contractStorage.get(address);
    return storage?.get(key) || '0x0';
  }

  /**
   * Transfer value between accounts
   */
  transfer(from: string, to: string, value: bigint): boolean {
    const fromAccount = this.accounts.get(from);
    
    if (!fromAccount || fromAccount.balance < value) {
      return false;  // Insufficient balance
    }
    
    // Deduct from sender
    fromAccount.balance -= value;
    
    // Add to receiver
    let toAccount = this.accounts.get(to);
    if (!toAccount) {
      toAccount = this.createAccount(to);
    }
    toAccount.balance += value;
    
    return true;
  }

  /**
   * Get state root hash
   * TODO: Implement Merkle Patricia Trie
   */
  getStateRoot(): string {
    // For MVP, return simple hash
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  /**
   * Hash contract code
   */
  private hashCode(code: string): string {
    // Simple hash for MVP
    return `0x${code.length.toString(16)}`;
  }

  /**
   * Create snapshot of state (for rollback)
   */
  snapshot(): Map<string, Account> {
    return new Map(this.accounts);
  }

  /**
   * Restore state from snapshot
   */
  revert(snapshot: Map<string, Account>): void {
    this.accounts = new Map(snapshot);
  }
}
