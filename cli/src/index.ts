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
    .description('List available test accounts')
    .option('--network <network>', 'Network', 'local')
    .action(async (options: any) => {
      try {
        console.log(chalk.cyan('\n📋 Test Accounts:\n'));
        // Generate some test accounts
        const accounts = [
          '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
          '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE',
          '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        ];
        accounts.forEach((addr, i) => {
          console.log(chalk.gray(`Account ${i}:`), chalk.white(addr));
        });
        console.log(chalk.gray('\n💡 Tip: Use these addresses for testing\n'));
      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error.message);
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
