/**
 * WebSocketServer.ts
 * 
 * Real-time WebSocket server for DAG updates and events.
 * Broadcasts DAG events to connected clients (primarily the visualizer).
 * 
 * Events Broadcasted:
 * - blockMined - New block added to DAG
 * - transactionAdded - New transaction in pool
 * - dagStatsUpdated - DAG statistics changed
 * - tipsChanged - DAG tips updated
 * - miningStarted - Mining has started
 * - miningStopped - Mining has stopped
 * 
 * @phase Phase 2 - Local Node & Mining Simulation
 */

import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { LocalNode } from './LocalNode';
import { Block, Transaction } from '../dag/Block';

export interface WebSocketServerConfig {
  port?: number;
  host?: string;
  path?: string;
}

interface WSMessage {
  type: string;
  data: any;
  timestamp: number;
}

export class WebSocketServer {
  private wss?: WSServer;
  private node: LocalNode;
  private config: Required<WebSocketServerConfig>;
  private clients: Set<WebSocket>;
  private isRunning: boolean;
  private messageQueue: WSMessage[];
  private maxQueueSize: number;

  constructor(node: LocalNode, config: WebSocketServerConfig = {}) {
    this.node = node;
    this.config = {
      port: config.port ?? 8546,
      host: config.host ?? 'localhost',
      path: config.path ?? '/ws',
    };
    
    this.clients = new Set();
    this.isRunning = false;
    this.messageQueue = [];
    this.maxQueueSize = 100; // Keep last 100 messages for new clients
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[WebSocketServer] Server is already running');
      return;
    }

    return new Promise((resolve) => {
      // Create WebSocket server
      this.wss = new WSServer({
        port: this.config.port,
        host: this.config.host,
        path: this.config.path,
      });

      this.wss.on('listening', () => {
        this.isRunning = true;
        console.log(`[WebSocketServer] WebSocket server listening on ws://${this.config.host}:${this.config.port}${this.config.path}`);
        console.log(`[WebSocketServer] Ready for visualizer connections`);
        resolve();
      });

      this.wss.on('connection', (ws: WebSocket, req) => {
        this.handleConnection(ws, req);
      });

      this.wss.on('error', (error) => {
        console.error('[WebSocketServer] Server error:', error);
      });

      // Subscribe to LocalNode events
      this.setupEventListeners();
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
    console.log(`[WebSocketServer] Client connected: ${clientId}`);
    
    // Track client metadata
    (ws as any)._clientId = clientId;
    (ws as any)._messagesSent = 0;
    
    this.clients.add(ws);

    // Send welcome message with current state
    this.sendToClient(ws, {
      type: 'welcome',
      data: {
        message: 'Connected to DagDev WebSocket server',
        dagStats: this.node.getStats().dag,
        tips: this.node.getDAG().getTips(),
      },
      timestamp: Date.now(),
    });

    // Send recent message history to new client
    if (this.messageQueue.length > 0) {
      this.sendToClient(ws, {
        type: 'history',
        data: {
          messages: this.messageQueue.slice(-20), // Last 20 messages
        },
        timestamp: Date.now(),
      });
    }

    // Handle messages from client
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('[WebSocketServer] Error parsing client message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`[WebSocketServer] Client disconnected: ${clientId}`);
      this.clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocketServer] Client error (${clientId}):`, error);
      this.clients.delete(ws);
    });
  }

  /**
   * Handle messages from client
   */
  private handleClientMessage(ws: WebSocket, message: any): void {
    console.log(`[WebSocketServer] Received message:`, message.type);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
        break;

      case 'getStats':
        this.sendToClient(ws, {
          type: 'stats',
          data: this.node.getStats(),
          timestamp: Date.now(),
        });
        break;

      case 'getTips':
        this.sendToClient(ws, {
          type: 'tips',
          data: this.node.getDAG().getTips(),
          timestamp: Date.now(),
        });
        break;

      case 'getBlock':
        const blockHash = message.data?.hash;
        if (blockHash) {
          const block = this.node.getDAG().getBlock(blockHash);
          this.sendToClient(ws, {
            type: 'block',
            data: block ? this.formatBlock(block) : null,
            timestamp: Date.now(),
          });
        }
        break;

      case 'getAllBlocks':
        const allBlocks = this.node.getDAG().getAllBlocks();
        this.sendToClient(ws, {
          type: 'allBlocks',
          data: allBlocks.map(b => this.formatBlock(b)),
          timestamp: Date.now(),
        });
        break;

      case 'mineBlocks':
        const count = message.data?.count || 1;
        this.node.mineBlocks(count).then(() => {
          this.sendToClient(ws, {
            type: 'miningComplete',
            data: { count },
            timestamp: Date.now(),
          });
        });
        break;

      default:
        console.log(`[WebSocketServer] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Setup event listeners for LocalNode
   */
  private setupEventListeners(): void {
    // Mining events
    this.node.on('miningStarted', () => {
      this.broadcast({
        type: 'miningStarted',
        data: {},
        timestamp: Date.now(),
      });
    });

    this.node.on('miningStopped', () => {
      this.broadcast({
        type: 'miningStopped',
        data: {},
        timestamp: Date.now(),
      });
    });

    // Block mined event
    this.node.on('blockMined', (block: Block) => {
      const message = {
        type: 'blockMined',
        data: {
          block: this.formatBlock(block),
          stats: this.node.getStats(),
          tips: this.node.getDAG().getTips(),
        },
        timestamp: Date.now(),
      };
      
      this.broadcast(message);
      this.addToQueue(message);
    });

    // Transaction added event
    this.node.on('transactionAdded', (tx: Transaction) => {
      const message = {
        type: 'transactionAdded',
        data: {
          transaction: this.formatTransaction(tx),
          poolSize: this.node.getTransactionPool().size(),
        },
        timestamp: Date.now(),
      };
      
      this.broadcast(message);
      this.addToQueue(message);
    });

    // Node started/stopped
    this.node.on('started', () => {
      this.broadcast({
        type: 'nodeStarted',
        data: {},
        timestamp: Date.now(),
      });
    });

    this.node.on('stopped', () => {
      this.broadcast({
        type: 'nodeStopped',
        data: {},
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: WSMessage): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    console.log(`[WebSocketServer] Broadcasted ${message.type} to ${this.clients.size} clients`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocket, message: WSMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      // Track messages sent per client
      (client as any)._messagesSent = ((client as any)._messagesSent || 0) + 1;
    }
  }

  /**
   * Add message to history queue
   */
  private addToQueue(message: WSMessage): void {
    this.messageQueue.push(message);
    
    // Keep queue size limited
    if (this.messageQueue.length > this.maxQueueSize) {
      this.messageQueue.shift();
    }
  }

  /**
   * Format block for transmission (convert BigInt to hex strings)
   */
  private formatBlock(block: Block): any {
    return {
      hash: block.header.hash,
      parentHashes: block.header.parentHashes,
      timestamp: block.header.timestamp,
      nonce: block.header.nonce,
      miner: block.header.miner,
      difficulty: block.header.difficulty,
      stateRoot: block.header.stateRoot,
      transactionsRoot: block.header.transactionsRoot,
      transactions: block.transactions.map(tx => this.formatTransaction(tx)),
      color: block.color,
      dagDepth: block.dagDepth,
      blueScore: block.blueScore,
    };
  }

  /**
   * Format transaction for transmission (convert BigInt to hex strings)
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
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.wss) {
      console.log('[WebSocketServer] Server is not running');
      return;
    }

    return new Promise((resolve) => {
      // Close all client connections
      this.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
      });
      this.clients.clear();

      // Close the server
      this.wss!.close(() => {
        this.isRunning = false;
        console.log('[WebSocketServer] Server stopped');
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
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get server configuration
   */
  getConfig(): Required<WebSocketServerConfig> {
    return { ...this.config };
  }

  /**
   * Manually send a custom event (for testing/debugging)
   */
  sendCustomEvent(type: string, data: any): void {
    this.broadcast({
      type,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get WebSocket server statistics
   */
  getStats() {
    const clients = Array.from(this.clients).map((ws: any, index) => ({
      clientId: ws._clientId || `client-${index}`,
      readyState: ws.readyState,
      messagesSent: ws._messagesSent || 0,
    }));

    return {
      isRunning: this.isRunning,
      connectedClients: this.clients.size,
      totalMessagesSent: clients.reduce((sum, c) => sum + c.messagesSent, 0),
      clients,
      config: this.config,
      queueSize: this.messageQueue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }
}
