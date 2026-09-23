import Rcon from 'rcon-srcds';
import { config } from './config.js';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`RCON agotó el tiempo de espera (${timeoutMs} ms)`)), timeoutMs);
    })
  ]);
}

async function execute(command: string): Promise<string> {
  const server = new Rcon.default({
    host: config.rconHost,
    port: config.rconPort,
    encoding: 'utf8',
    timeout: config.rconTimeoutMs
  });

  try {
    const authenticated = await withTimeout(server.authenticate(config.rconPassword), config.rconTimeoutMs);
    if (!authenticated) throw new Error('RCON rechazó la contraseña');
    const result = await withTimeout(server.execute(command), config.rconTimeoutMs);
    return String(result);
  } finally {
    await server.disconnect();
  }
}

export async function sendSay(message: string): Promise<string> {
  const safe = message.replace(/[\\\"\r\n]/g, (character) => `\\${character}`);
  return execute(`say "${safe}"`);
}

export async function getStatus(): Promise<string> {
  return execute('status');
}
