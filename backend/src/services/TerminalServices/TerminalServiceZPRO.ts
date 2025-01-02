import { spawn } from 'child_process';
import logger from '../../utils/loggerZPRO';

class TerminalService {
  private shell: any | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!this.shell) {
      this.shell = spawn('bash', {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.shell.stdout.on('data', (data: Buffer) => {
        logger.info(`::: Z-PRO ::: STDOUT: ${data.toString()}`);
      });

      this.shell.stderr.on('data', (data: Buffer) => {
        logger.info(`::: Z-PRO ::: STDERR: ${data.toString()}`);
      });
    }
  }

  public async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.shell) {
        reject('Shell não iniciada.');
        return;
      }

      let output = '';

      this.shell.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      this.shell.stderr.on('data', (data: Buffer) => {
        output += data.toString();
      });

      this.shell.stdin.write(`${command}\n`, (error: Error | null) => {
        if (error) {
          reject(error.toString());
        }
      });

      setTimeout(() => {
        resolve(output);
      }, 1000);
    });
  }

  public close(): void {
    if (this.shell) {
      this.shell.kill();
      this.shell = null;
    }
  }
}

export const terminalService = new TerminalService(); 