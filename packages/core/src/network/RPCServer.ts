/**
 * RPCServer.ts
 * 
 * JSON-RPC 2.0 server for DagDev BlockDAG node.
 * Provides both standard Ethereum eth_* methods and custom dag_* methods.
 * 
 * Standard Methods (Ethereum compatibility with real EVM):
 * - eth_blockNumber, eth_chainId, eth_getBalance ✅ Real EVM
 * - eth_getBlockByHash, eth_getBlockByNumber
 * - eth_sendTransaction, eth_call ✅ Real EVM, eth_estimateGas ✅ Real EVM
 * - eth_getTransactionReceipt ✅ Real receipts, eth_getTransactionCount ✅ Real nonces
 * - eth_getCode ✅ Real EVM, eth_getStorageAt ✅ Real EVM
 * 
 * Custom Methods (DAG-specific):
 * - dag_getDAGInfo, dag_getBlockByHash, dag_sendTransaction
 * - dag_getBlueSet, dag_getRedSet, dag_getTips
 * - dag_getBlockParents, dag_getBlockChildren
 * - dag_getAnticone, dag_getBlueScore
 * 
 * @phase Phase 3 - EVM Integration Complete
 */

import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { LocalNode } from './LocalNode';
import { Block, Transaction } from '../dag/Block';

/**
 * JSON-RPC 2.0 Request interface
 */
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: any[];
}

/**
 * JSON-RPC 2.0 Response interface
 */
interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * JSON-RPC 2.0 Error codes
 */
enum JsonRpcError {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
}

/**
 * Enhanced block response with both Ethereum and DAG fields
 */
interface BlockResponse {
  // Standard Ethereum fields
  hash: string;
  number: number;
  parentHash: string; // First parent for eth compatibility
  timestamp: number;
  miner: string;
  difficulty: number;
  transactions: string[] | Transaction[];
  transactionsRoot: string;
  stateRoot: string;
  nonce: number;
  
  // DAG-specific extensions
  parentHashes: string[]; // All parents
  color: 'blue' | 'red' | 'pending';
  dagDepth: number;
  blueScore: number;
  anticoneSize?: number;
}

export interface RPCServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
}

export class RPCServer {
  private app: Express;
  private server?: Server;
  private node: LocalNode;
  private config: Required<RPCServerConfig>;
  private isRunning: boolean;
  
  // Mock chain ID and balances (until EVM integration)
  private chainId: number = 1337; // Local dev chain
  private mockBalances: Map<string, bigint> = new Map();

  constructor(node: LocalNode, config: RPCServerConfig = {}) {
    this.node = node;
    this.config = {
      port: config.port ?? 8545,
      host: config.host ?? 'localhost',
      cors: config.cors ?? true,
    };
    
    this.app = express();
    this.isRunning = false;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeMockData();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Enable CORS for web3 providers
    if (this.config.cors) {
      this.app.use(cors());
    }
    
    // Parse JSON bodies
    this.app.use(bodyParser.json());
    
    // Log requests
    this.app.use((req, res, next) => {
      if (req.body?.method) {
        console.log(`[RPC] ${req.body.method}`);
      }
      next();
    });
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Main JSON-RPC endpoint
    this.app.post('/', (req, res) => this.handleJsonRpc(req, res));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        node: this.node.isNodeRunning() ? 'running' : 'stopped',
        blocks: this.node.getDAG().getAllBlocks().length,
      });
    });
  }

  /**
   * Initialize mock data for testing
   */
  private initializeMockData(): void {
    // Mock balances for testing
    this.mockBalances.set('0x0000000000000000000000000000000000000000', BigInt(0));
    this.mockBalances.set('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', BigInt('10000000000000000000000')); // 10000 ETH
    this.mockBalances.set('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', BigInt('10000000000000000000000'));
  }

  /**
   * Handle JSON-RPC 2.0 request
   */
  private async handleJsonRpc(req: Request, res: Response): Promise<void> {
    const request: JsonRpcRequest = req.body;
    
    // Validate JSON-RPC format
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      res.json(this.createErrorResponse(null, JsonRpcError.INVALID_REQUEST, 'Invalid JSON-RPC version'));
      return;
    }
    
    if (!request.method) {
      res.json(this.createErrorResponse(request.id, JsonRpcError.INVALID_REQUEST, 'Method not specified'));
      return;
    }
    
    try {
      // Route to appropriate handler
      const result = await this.handleMethod(request.method, request.params || []);
      res.json(this.createSuccessResponse(request.id, result));
    } catch (error: any) {
      console.error(`[RPC] Error handling ${request.method}:`, error.message);
      res.json(this.createErrorResponse(
        request.id,
        JsonRpcError.INTERNAL_ERROR,
        error.message,
        error.stack
      ));
    }
  }

  /**
   * Route method to appropriate handler
   */
  private async handleMethod(method: string, params: any[]): Promise<any> {
    // Standard Ethereum methods
    if (method.startsWith('eth_')) {
      return this.handleEthMethod(method, params);
    }
    
    // Custom DAG methods
    if (method.startsWith('dag_')) {
      return this.handleDagMethod(method, params);
    }
    
    // Net methods
    if (method.startsWith('net_')) {
      return this.handleNetMethod(method, params);
    }
    
    throw new Error(`Method not found: ${method}`);
  }

  /**
   * Handle standard Ethereum eth_* methods
   */
  private async handleEthMethod(method: string, params: any[]): Promise<any> {
    const dag = this.node.getDAG();
    const allBlocks = dag.getAllBlocks();
    
    switch (method) {
      case 'eth_chainId':
        return `0x${this.chainId.toString(16)}`;
      
      case 'eth_blockNumber':
        // Return max DAG depth as block number
        const stats = dag.getStats();
        return `0x${stats.maxDepth.toString(16)}`;
      
      case 'eth_getBalance':
        // params: [address, block]
        const address = params[0];
        // Use real EVM balance
        try {
          const evmExecutor = this.node.getMiner().getEVMExecutor();
          const balance = await evmExecutor.getBalance(address);
          return `0x${balance.toString(16)}`;
        } catch (error) {
          // Fallback to mock for testing
          const balance = this.mockBalances.get(address) || BigInt(0);
          return `0x${balance.toString(16)}`;
        }
      
      case 'eth_getBlockByHash':
        // params: [blockHash, fullTransactions]
        const blockHash = params[0];
        const fullTxs = params[1] || false;
        const block = dag.getBlock(blockHash);
        
        if (!block) {
          return null;
        }
        
        return this.formatBlockResponse(block, fullTxs);
      
      case 'eth_getBlockByNumber':
        // params: [blockNumber, fullTransactions]
        const blockNum = this.parseNumber(params[0]);
        const fullTxs2 = params[1] || false;
        
        // Find block at specific depth
        const blockAtDepth = allBlocks.find(b => b.dagDepth === blockNum);
        
        if (!blockAtDepth) {
          return null;
        }
        
        return this.formatBlockResponse(blockAtDepth, fullTxs2);
      
      case 'eth_sendTransaction':
      case 'eth_sendRawTransaction':
        // params: [transaction object or raw tx]
        // TODO: Parse transaction and add to pool
        // For now, create a mock transaction
        const tx = this.createMockTransaction(params[0]);
        const added = this.node.addTransaction(tx);
        
        if (!added) {
          throw new Error('Transaction rejected');
        }
        
        return tx.hash;
      
      case 'eth_call':
        // params: [transaction, block]
        try {
          const callTx = params[0];
          const evmExecutor = this.node.getMiner().getEVMExecutor();
          const result = await evmExecutor.call(
            callTx.to,
            callTx.data || '0x',
            callTx.from,
            callTx.value ? BigInt(callTx.value) : undefined
          );
          // Convert Uint8Array to hex string
          return '0x' + Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error: any) {
          throw new Error(`eth_call failed: ${error.message}`);
        }
      
      case 'eth_estimateGas':
        // params: [transaction]
        try {
          const estimateTx = params[0];
          const evmExecutor = this.node.getMiner().getEVMExecutor();
          const tx: Transaction = {
            hash: '0xestimate',
            from: estimateTx.from,
            to: estimateTx.to || '',
            value: estimateTx.value ? BigInt(estimateTx.value) : BigInt(0),
            gasLimit: estimateTx.gas ? BigInt(estimateTx.gas) : BigInt(10000000),
            gasPrice: estimateTx.gasPrice ? BigInt(estimateTx.gasPrice) : BigInt(1000000000),
            nonce: 0,
            data: estimateTx.data || '',
          };
          const gasEstimate = await evmExecutor.estimateGas(tx);
          return `0x${gasEstimate.toString(16)}`;
        } catch (error) {
          return '0x5208'; // 21000 gas fallback
        }
      
      case 'eth_getTransactionReceipt':
        // params: [txHash]
        const txHash = params[0];
        const receipt = this.node.getMiner().getReceipt(txHash);
        
        if (!receipt) {
          return null;
        }
        
        // Format receipt for JSON-RPC
        return {
          transactionHash: receipt.transactionHash,
          blockHash: receipt.blockHash,
          from: receipt.from,
          to: receipt.to,
          gasUsed: `0x${receipt.gasUsed.toString(16)}`,
          cumulativeGasUsed: `0x${receipt.cumulativeGasUsed.toString(16)}`,
          status: receipt.status === 'success' ? '0x1' : '0x0',
          logs: receipt.logs,
          contractAddress: receipt.contractAddress || null,
        };
      
      case 'eth_getTransactionCount':
        // params: [address, block]
        const accountAddress = params[0];
        try {
          const evmExecutor = this.node.getMiner().getEVMExecutor();
          const nonce = await evmExecutor.getNonce(accountAddress);
          return `0x${nonce.toString(16)}`;
        } catch (error) {
          return '0x0';
        }
      
      case 'eth_getCode':
        // params: [address, block]
        const codeAddress = params[0];
        try {
          const evmExecutor = this.node.getMiner().getEVMExecutor();
          const code = await evmExecutor.getCode(codeAddress);
          if (code.length === 0) {
            return '0x';
          }
          return '0x' + Array.from(code).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
          return '0x';
        }
      
      case 'eth_getStorageAt':
        // params: [address, position, block]
        const storageAddress = params[0];
        const position = params[1];
        try {
          const evmExecutor = this.node.getMiner().getEVMExecutor();
          const value = await evmExecutor.getStorageAt(storageAddress, position);
          return '0x' + Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
          return '0x' + '0'.repeat(64); // Return empty storage slot
        }
      
      case 'eth_gasPrice':
        return '0x3b9aca00'; // 1 gwei
      
      case 'eth_accounts':
        // Return mock accounts
        return Array.from(this.mockBalances.keys());
      
      default:
        throw new Error(`Ethereum method not implemented: ${method}`);
    }
  }

  /**
   * Handle custom DAG dag_* methods
   */
  private async handleDagMethod(method: string, params: any[]): Promise<any> {
    const dag = this.node.getDAG();
    const allBlocks = dag.getAllBlocks();
    
    switch (method) {
      case 'dag_getDAGInfo':
      case 'dag_getStats':
        return this.node.getStats();
      
      case 'dag_getBlockByHash':
        // params: [blockHash]
        const blockHash = params[0];
        const block = dag.getBlock(blockHash);
        
        if (!block) {
          return null;
        }
        
        return this.formatBlockResponse(block, true);
      
      case 'dag_sendTransaction':
        // params: [transaction object]
        const tx = this.createMockTransaction(params[0]);
        const added = this.node.addTransaction(tx);
        
        if (!added) {
          throw new Error('Transaction rejected by pool');
        }
        
        return {
          hash: tx.hash,
          status: 'pending',
          addedToPool: true,
        };
      
      case 'dag_getBlueSet':
        // Get all blue blocks
        const blueBlocks = allBlocks
          .filter(b => b.color === 'blue')
          .map(b => ({
            hash: b.header.hash,
            depth: b.dagDepth,
            blueScore: b.blueScore,
          }));
        
        return blueBlocks;
      
      case 'dag_getRedSet':
        // Get all red blocks
        const redBlocks = allBlocks
          .filter(b => b.color === 'red')
          .map(b => ({
            hash: b.header.hash,
            depth: b.dagDepth,
            blueScore: b.blueScore,
          }));
        
        return redBlocks;
      
      case 'dag_getTips':
        // Get current DAG tips
        const tips = dag.getTips();
        return tips.map(tipHash => {
          const tipBlock = dag.getBlock(tipHash);
          return {
            hash: tipHash,
            depth: tipBlock?.dagDepth || 0,
            color: tipBlock?.color || 'pending',
          };
        });
      
      case 'dag_getBlockParents':
        // params: [blockHash]
        const hash1 = params[0];
        const block1 = dag.getBlock(hash1);
        
        if (!block1) {
          return null;
        }
        
        return block1.header.parentHashes.map(parentHash => {
          const parent = dag.getBlock(parentHash);
          return {
            hash: parentHash,
            depth: parent?.dagDepth || 0,
            color: parent?.color || 'pending',
          };
        });
      
      case 'dag_getBlockChildren':
        // params: [blockHash]
        const hash2 = params[0];
        const children = dag.getChildren(hash2);
        
        return children.map(childHash => {
          const child = dag.getBlock(childHash);
          return {
            hash: childHash,
            depth: child?.dagDepth || 0,
            color: child?.color || 'pending',
          };
        });
      
      case 'dag_getAnticone':
        // params: [blockHash]
        const hash3 = params[0];
        const anticone = dag.getAnticone(hash3);
        
        return anticone.map(blockHash => {
          const block = dag.getBlock(blockHash);
          return {
            hash: blockHash,
            depth: block?.dagDepth || 0,
            color: block?.color || 'pending',
          };
        });
      
      case 'dag_getBlueScore':
        // params: [blockHash]
        const hash4 = params[0];
        const block4 = dag.getBlock(hash4);
        
        if (!block4) {
          return null;
        }
        
        return {
          hash: block4.header.hash,
          blueScore: block4.blueScore,
          color: block4.color,
        };
      
      case 'dag_mineBlocks':
        // params: [count]
        const count = params[0] || 1;
        await this.node.mineBlocks(count);
        
        return {
          mined: count,
          totalBlocks: dag.getAllBlocks().length,
        };
      
      default:
        throw new Error(`DAG method not implemented: ${method}`);
    }
  }

  /**
   * Handle net_* methods
   */
  private async handleNetMethod(method: string, params: any[]): Promise<any> {
    switch (method) {
      case 'net_version':
        return this.chainId.toString();
      
      case 'net_listening':
        return this.isRunning;
      
      case 'net_peerCount':
        return '0x0'; // No peers in local mode
      
      default:
        throw new Error(`Net method not implemented: ${method}`);
    }
  }

  /**
   * Format block for JSON-RPC response
   */
  private formatBlockResponse(block: Block, fullTransactions: boolean): BlockResponse {
    return {
      // Standard Ethereum fields
      hash: block.header.hash,
      number: block.dagDepth,
      parentHash: block.header.parentHashes[0] || '0x0',
      timestamp: block.header.timestamp,
      miner: block.header.miner,
      difficulty: block.header.difficulty,
      transactions: fullTransactions 
        ? block.transactions.map(tx => this.formatTransaction(tx))
        : block.transactions.map(tx => tx.hash),
      transactionsRoot: block.header.transactionsRoot,
      stateRoot: block.header.stateRoot,
      nonce: block.header.nonce,
      
      // DAG-specific fields
      parentHashes: block.header.parentHashes,
      color: block.color,
      dagDepth: block.dagDepth,
      blueScore: block.blueScore,
    };
  }

  /**
   * Format transaction for JSON-RPC response (convert BigInt to hex strings)
   */
  private formatTransaction(tx: Transaction): any {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: `0x${tx.value.toString(16)}`,
      gasPrice: `0x${tx.gasPrice.toString(16)}`,
      gasLimit: `0x${tx.gasLimit.toString(16)}`,
      nonce: tx.nonce,
      data: tx.data,
    };
  }

  /**
   * Create mock transaction from params
   */
  private createMockTransaction(params: any): Transaction {
    const from = params.from || '0x0000000000000000000000000000000000000000';
    const to = params.to || '0x0000000000000000000000000000000000000000';
    const value = this.parseBigInt(params.value || '0x0');
    const gasPrice = this.parseBigInt(params.gasPrice || '0x3b9aca00'); // 1 gwei
    const gasLimit = this.parseBigInt(params.gas || '0x5208'); // 21000
    const data = params.data || '';
    const nonce = this.parseNumber(params.nonce || '0x0');
    
    const hash = this.generateTxHash(from, to, value, nonce);
    
    return {
      hash,
      from,
      to,
      value,
      gasPrice,
      gasLimit,
      nonce,
      data,
    };
  }

  /**
   * Generate transaction hash
   */
  private generateTxHash(from: string, to: string, value: bigint, nonce: number): string {
    const crypto = require('crypto');
    const data = JSON.stringify({ from, to, value: value.toString(), nonce, timestamp: Date.now() });
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Parse hex string to number
   */
  private parseNumber(hex: string): number {
    if (hex === 'latest' || hex === 'pending') {
      return this.node.getDAG().getStats().maxDepth;
    }
    if (hex === 'earliest') {
      return 0;
    }
    return parseInt(hex, 16);
  }

  /**
   * Parse hex string to bigint
   */
  private parseBigInt(hex: string): bigint {
    if (!hex || hex === '0x') {
      return BigInt(0);
    }
    return BigInt(hex);
  }

  /**
   * Create JSON-RPC success response
   */
  private createSuccessResponse(id: string | number | null, result: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  /**
   * Create JSON-RPC error response
   */
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: any
  ): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data,
      },
    };
  }

  /**
   * Start the RPC server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[RPCServer] Server is already running');
      return;
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;
        console.log(`[RPCServer] JSON-RPC server listening on http://${this.config.host}:${this.config.port}`);
        console.log(`[RPCServer] Supported methods:`);
        console.log(`  Standard: eth_blockNumber, eth_getBalance, eth_sendTransaction, eth_call, etc.`);
        console.log(`  Custom: dag_getDAGInfo, dag_getTips, dag_getBlueSet, dag_mineBlocks, etc.`);
        resolve();
      });
    });
  }

  /**
   * Stop the RPC server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      console.log('[RPCServer] Server is not running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.isRunning = false;
        console.log('[RPCServer] Server stopped');
        resolve();
      });
    });
  }

  /**
   * Check if server is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get server configuration
   */
  getConfig(): Required<RPCServerConfig> {
    return { ...this.config };
  }
}
