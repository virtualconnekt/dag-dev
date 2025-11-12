/**
 * logger.ts
 * 
 * Colored console output utilities for CLI
 */

import chalk from 'chalk';

export const logger = {
  success: (message: string) => console.log(chalk.green('✅ ' + message)),
  error: (message: string) => console.log(chalk.red('❌ ' + message)),
  warning: (message: string) => console.log(chalk.yellow('⚠️  ' + message)),
  info: (message: string) => console.log(chalk.blue('ℹ️  ' + message)),
  log: (message: string) => console.log(message),
  
  title: (message: string) => console.log(chalk.bold.cyan('\n' + message + '\n')),
  subtitle: (message: string) => console.log(chalk.bold(message)),
  
  progress: (current: number, total: number, message: string) => {
    const percent = Math.round((current / total) * 100);
    console.log(chalk.gray(`[${current}/${total}] ${percent}% - ${message}`));
  },
  
  box: (title: string, content: string[]) => {
    const width = 60;
    const border = '═'.repeat(width);
    
    console.log(chalk.cyan('\n╔' + border + '╗'));
    console.log(chalk.cyan('║') + chalk.bold.white(title.padStart((width + title.length) / 2).padEnd(width)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠' + border + '╣'));
    
    content.forEach(line => {
      console.log(chalk.cyan('║ ') + line.padEnd(width - 2) + chalk.cyan(' ║'));
    });
    
    console.log(chalk.cyan('╚' + border + '╝\n'));
  },
  
  command: (cmd: string, description: string) => {
    console.log('  ' + chalk.cyan(cmd.padEnd(30)) + chalk.gray(description));
  },
  
  section: (title: string) => {
    console.log(chalk.bold.yellow('\n▸ ' + title));
  }
};
