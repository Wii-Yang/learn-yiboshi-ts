import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import util from 'node:util';

let initialized = false;
let currentLogPath = '';
let latestLogPath = '';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function getLocalTimestamp(): string {
  const date = new Date();
  const timezoneOffset = -date.getTimezoneOffset();
  const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
  const timezoneHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
  const timezoneMinutes = pad(Math.abs(timezoneOffset) % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())} ${timezoneSign}${timezoneHours}:${timezoneMinutes}`;
}

function getLocalTimestampForFilename(): string {
  return getLocalTimestamp().replace(/[ :+]/g, '-');
}

function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      return util.inspect(arg, { depth: 8, colors: false });
    })
    .join(' ');
}

export function initLogger(): void {
  if (initialized) return;
  initialized = true;

  const logDir = path.join(process.cwd(), 'logs');
  mkdirSync(logDir, { recursive: true });

  const timestamp = getLocalTimestampForFilename();
  currentLogPath = path.join(logDir, `run-${timestamp}.log`);
  latestLogPath = path.join(logDir, 'latest.log');
  writeFileSync(latestLogPath, '', 'utf8');
  const originalLog = console.log.bind(console);
  const originalError = console.error.bind(console);

  function write(level: string, args: unknown[]): void {
    const line = `[${getLocalTimestamp()}] [${level}] ${formatArgs(args)}\n`;
    appendFileSync(currentLogPath, line, 'utf8');
    appendFileSync(latestLogPath, line, 'utf8');
  }

  console.log = (...args: unknown[]) => {
    const timestamp = getLocalTimestamp();
    write('INFO', args);
    originalLog(`[${timestamp}] ${formatArgs(args)}`);
  };

  console.error = (...args: unknown[]) => {
    const timestamp = getLocalTimestamp();
    write('ERROR', args);
    originalError(`[${timestamp}] ${formatArgs(args)}`);
  };

  console.log(`日志文件：${currentLogPath}`);
}

export function logLive(message: string): void {
  const timestamp = getLocalTimestamp();
  const consoleMessage = `[${timestamp}] ${message}`;

  if (initialized && currentLogPath && latestLogPath) {
    const line = `[${timestamp}] [INFO] ${message}\n`;
    appendFileSync(currentLogPath, line, 'utf8');
    appendFileSync(latestLogPath, line, 'utf8');
  }

  process.stdout.write(`${consoleMessage}\n`);
}

export function logInteractive(message = ''): void {
  process.stdout.write(`${message}\n`);
}
