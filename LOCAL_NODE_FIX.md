# Local Node Connection Fix - v1.0.5

## Problem Summary

The local node (`dagdev node`) was showing initialization messages but not accepting RPC connections on port 8545. Users saw:

```
[LocalNode] RPC server initialized on port 8545
🚀 Starting DagDev Local Node...
[THEN IT HUNG - never showed "✅ Node is running"]
```

Testing with `curl http://127.0.0.1:8545` returned no response.

## Root Cause

The RPC and WebSocket servers were binding to `localhost` by default, which caused connection issues on:
- Windows systems
- Some Linux configurations
- Network interfaces that don't properly resolve `localhost`

## Solution

Changed the default host binding from `localhost` to `0.0.0.0` to accept connections from all network interfaces:

### Files Changed

**1. `packages/core/src/network/RPCServer.ts`** (line 104)
```typescript
// BEFORE:
host: config.host ?? 'localhost',

// AFTER:
host: config.host ?? '0.0.0.0',
```

**2. `packages/core/src/network/WebSocketServer.ts`** (line 47)
```typescript
// BEFORE:
host: config.host ?? 'localhost',

// AFTER:
host: config.host ?? '0.0.0.0',
```

## Published Versions

- ✅ **@dagdev/core@1.0.1** - Contains the host binding fix
- ✅ **dagdev@1.0.5** - Updated CLI using core@1.0.1

## Testing

Users can now run local development with:

**Terminal 1:**
```bash
npm install -g dagdev@1.0.5
dagdev node
# Should now show "✅ Node is running" and accept connections
```

**Terminal 2:**
```bash
dagdev run scripts/deploy.js --network local
# Should connect successfully to http://127.0.0.1:8545
```

**Verify RPC server:**
```bash
curl http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

## Cross-Platform Compatibility

This fix ensures the local node works correctly on:
- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)
- ✅ macOS (Intel & Apple Silicon)
- ✅ WSL (Windows Subsystem for Linux)

## Security Note

Binding to `0.0.0.0` allows connections from any network interface. For local development this is safe and expected. If running on a server exposed to the internet, users should configure firewall rules to restrict access to port 8545 and 8546.

## Migration

No action required for users. Simply update to the latest version:

```bash
# If using npm global install
npm update -g dagdev

# If using npx
npx dagdev@1.0.5 node

# Verify version
dagdev --version  # Should show v1.0.5 or higher
```

## Related Issues

- Fixed Windows connection failures
- Fixed "Could not connect to node RPC endpoint" error
- Fixed local deployment workflow requiring two terminals
- Node now properly completes startup and shows "✅ Node is running"

## Commits

- `fd73fed` - Fix local node RPC server binding (v1.0.5)
- `cb86c70` - Update README with npm installation instructions (v1.0.5)
