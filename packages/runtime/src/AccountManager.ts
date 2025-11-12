/**
 * AccountManager.ts
 * 
 * Manages accounts and private keys for signing transactions.
 * Supports:
 * - Private key import
 * - Address derivation
 * - Transaction signing
 * 
 * @phase Phase 7 - CLI Tool & Testnet Support
 */

import { privateToAddress } from '@ethereumjs/util';

export interface Account {
  address: string;
  privateKey: string;
}

export class AccountManager {
  private accounts: Map<string, Account> = new Map();
  private defaultAccount?: Account;

  /**
   * Load accounts from configuration
   */
  static fromConfig(accountsConfig: any): AccountManager {
    const manager = new AccountManager();

    if (accountsConfig === 'hardhat') {
      // For hardhat accounts, we don't load private keys
      // The RPC server provides test accounts
      return manager;
    }

    if (accountsConfig?.privateKeys && Array.isArray(accountsConfig.privateKeys)) {
      for (const pk of accountsConfig.privateKeys) {
        if (pk) {
          manager.importPrivateKey(pk);
        }
      }
    }

    return manager;
  }

  /**
   * Import a private key
   */
  importPrivateKey(privateKey: string): Account {
    // Normalize private key format
    const pk = privateKey.startsWith('0x') 
      ? privateKey.slice(2) 
      : privateKey;

    if (pk.length !== 64) {
      throw new Error('Invalid private key length. Expected 64 hex characters.');
    }

    // Derive address from private key
    const privateKeyBuffer = Buffer.from(pk, 'hex');
    const addressBuffer = privateToAddress(privateKeyBuffer);
    
    // Convert Uint8Array to hex string (addressBuffer is Uint8Array, not Node.js Buffer)
    const address = '0x' + Buffer.from(addressBuffer).toString('hex');

    const account: Account = {
      address,
      privateKey: '0x' + pk,
    };

    this.accounts.set(address.toLowerCase(), account);

    // Set as default if it's the first account
    if (!this.defaultAccount) {
      this.defaultAccount = account;
    }

    return account;
  }

  /**
   * Get all account addresses
   */
  getAddresses(): string[] {
    return Array.from(this.accounts.values()).map(acc => acc.address);
  }

  /**
   * Get account by address
   */
  getAccount(address: string): Account | undefined {
    return this.accounts.get(address.toLowerCase());
  }

  /**
   * Get default account
   */
  getDefaultAccount(): Account | undefined {
    return this.defaultAccount;
  }

  /**
   * Get private key for address
   */
  getPrivateKey(address: string): string | undefined {
    const account = this.accounts.get(address.toLowerCase());
    return account?.privateKey;
  }

  /**
   * Check if we have accounts loaded
   */
  hasAccounts(): boolean {
    return this.accounts.size > 0;
  }
}
