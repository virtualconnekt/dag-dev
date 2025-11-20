/**
 * index.ts
 * 
 * Main CLI entry point for DagDev.
 * Implements all dagdev commands.
 * 
 * Commands:
 * - dagdev init <project> - Initialize new project
 * - dagdev node - Start local DAG node
 * - dagdev test - Run tests
 * - dagdev compile - Compile contracts
 * - dagdev run <script> - Run deployment script
 * - dagdev console - Interactive REPL
 * - dagdev accounts - List test accounts
 * 
 * @phase Phase 7 - CLI Tool
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

/**
 * Main CLI program
 */
async function main() {
  program
    .name('dagdev')
    .description(chalk.cyan('🚀 DagDev - Development Framework For BlockDAG Network'))
    .version('1.0.0');

  // dagdev init
  program
    .command('init <project>')
    .description('Initialize a new DagDev project')
    .option('-t, --template <template>', 'Project template (default, empty, advanced)', 'default')
    .action(async (project: string, options: any) => {
      try {
        const { initCommand } = await import('./commands/init');
        await initCommand(project, options);
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev node
  program
    .command('node')
    .description('Start local DAG blockchain node (or show info for remote networks)')
    .option('-n, --network <name>', 'Network name', 'local')
    .option('-p, --port <port>', 'RPC server port', '8545')
    .option('-w, --ws-port <port>', 'WebSocket server port', '8546')
    .option('-m, --mining', 'Enable automatic mining', true)
    .option('-k, --k-value <k>', 'GHOSTDAG k parameter', '18')
    .option('--parallelism <count>', 'Parallel blocks per round', '2')
    .option('--interval <ms>', 'Mining interval in milliseconds', '2000')
    .action(async (options: any) => {
      try {
        const { nodeCommand } = await import('./commands/node');
        await nodeCommand(options);
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev test
  program
    .command('test [files...]')
    .description('Run tests with DAG-aware test runner')
    .option('--network <network>', 'Network to test on', 'local')
    .option('--grep <pattern>', 'Only run tests matching pattern')
    .option('--timeout <ms>', 'Test timeout in milliseconds', '10000')
    .action(async (files: string[], options: any) => {
      try {
        const { testCommand } = await import('./commands/test');
        await testCommand(files, options);
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev compile
  program
    .command('compile')
    .description('Compile Solidity smart contracts')
    .option('--force', 'Force recompilation')
    .option('--quiet', 'Suppress output')
    .action(async (options: any) => {
      try {
        const { compileCommand } = await import('./commands/compile');
        await compileCommand(options);
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev run
  program
    .command('run <script>')
    .description('Run a deployment or utility script')
    .option('--network <network>', 'Network to run on', 'local')
    .option('--no-compile', 'Skip compilation')
    .action(async (script: string, options: any) => {
      try {
        const { runCommand } = await import('./commands/run');
        await runCommand(script, options);
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev console
  program
    .command('console')
    .description('Open interactive JavaScript console with DagDev context')
    .option('--network <network>', 'Network to connect to', 'local')
    .action(async (options: any) => {
      try {
        console.log(chalk.yellow('ℹ️  Interactive console coming in Phase 7.5'));
        console.log(chalk.gray('   Use: const dre = await DagRuntime.create()'));
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev accounts
  program
    .command('accounts')
    .description('List available test accounts with private keys')
    .option('--network <network>', 'Network', 'local')
    .action(async (options: any) => {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const crypto = await import('crypto');
        
        // Path to store user's unique seed
        const dagdevDir = path.join(os.homedir(), '.dagdev');
        const seedFile = path.join(dagdevDir, 'seed.txt');
        
        let seed: string;
        
        // Check if seed exists, otherwise generate new one
        if (fs.existsSync(seedFile)) {
          seed = fs.readFileSync(seedFile, 'utf8').trim();
        } else {
          // Generate unique seed based on machine and random data
          const hostname = os.hostname();
          const randomBytes = crypto.randomBytes(32).toString('hex');
          seed = crypto.createHash('sha256').update(hostname + randomBytes).digest('hex');
          
          // Create .dagdev directory if it doesn't exist
          if (!fs.existsSync(dagdevDir)) {
            fs.mkdirSync(dagdevDir, { recursive: true });
          }
          
          // Save seed for future use
          fs.writeFileSync(seedFile, seed, 'utf8');
        }
        
        console.log(chalk.cyan('\nDagDev Test Accounts (Unique to Your Machine)\n'));
        console.log(chalk.yellow('WARNING: These accounts are for local development only.'));
        console.log(chalk.yellow('NEVER use these accounts on mainnet or with real funds!\n'));
        
        // Generate 3 deterministic accounts from seed
        const testAccounts: Array<{address: string, privateKey: string, balance: string}> = [];
        for (let i = 0; i < 3; i++) {
          const accountSeed = crypto.createHash('sha256').update(seed + i.toString()).digest('hex');
          const privateKey = '0x' + accountSeed;
          
          // Derive address from private key (simplified - using last 20 bytes of hash)
          const addressHash = crypto.createHash('sha256').update(accountSeed).digest('hex');
          const address = '0x' + addressHash.substring(24, 64);
          
          testAccounts.push({
            address,
            privateKey,
            balance: '10000 BDAG'
          });
        }
        
        testAccounts.forEach((account, i) => {
          console.log(chalk.cyan(`Account #${i}:`));
          console.log(chalk.gray('  Address:    '), chalk.white(account.address));
          console.log(chalk.gray('  Private Key:'), chalk.green(account.privateKey));
          console.log(chalk.gray('  Balance:    '), chalk.yellow(account.balance));
          console.log();
        });
        
        console.log(chalk.gray(`Seed stored in: ${seedFile}`));
        console.log(chalk.gray('Delete this file to generate new accounts.\n'));
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev clean
  program
    .command('clean')
    .description('Clean cache and artifacts')
    .action(async () => {
      try {
        console.log(chalk.cyan('🧹 Cleaning...'));
        const dirsToClean = ['cache', 'artifacts', 'dist'];
        let cleaned = 0;
        for (const dir of dirsToClean) {
          const dirPath = path.join(process.cwd(), dir);
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true });
            console.log(chalk.gray(`  ✓ Removed ${dir}/`));
            cleaned++;
          }
        }
        if (cleaned === 0) {
          console.log(chalk.gray('  Nothing to clean'));
        } else {
          console.log(chalk.green(`\n✅ Cleaned ${cleaned} directories`));
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // dagdev visualize
  program
    .command('visualize')
    .description('Open DAG visualizer in browser')
    .option('-p, --port <port>', 'Visualizer port', '3000')
    .action(async (options: any) => {
      try {
        const { visualizeCommand } = await import('./commands/visualize');
        await visualizeCommand(options);
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
      }
    });

  // Show help if no command specified
  if (process.argv.length === 2) {
    program.help();
  }

  program.parse();
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  console.error(chalk.gray(error.stack));
  process.exit(1);
});
