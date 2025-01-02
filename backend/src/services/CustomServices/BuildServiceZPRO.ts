import { exec } from 'child_process';
import path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..', '..');
const FRONTEND_PATH = path.join(PROJECT_ROOT, 'frontend');

type BuildCallback = (error: Error | null, stdout: string, stderr: string) => void;

export const buildFrontend = (callback: BuildCallback): void => {
  const buildCommand = 'export NODE_OPTIONS=--openssl-legacy-provider && npm run build -P -px quasar pwa';
  
  const options = {
    cwd: FRONTEND_PATH
  };

  exec(buildCommand, options, callback);
}; 