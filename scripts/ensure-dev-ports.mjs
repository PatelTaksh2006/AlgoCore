import { execFileSync } from 'node:child_process';

const ports = [4000, 4001, 4002];

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' });
}

function getListeningPids(port) {
  const output = run('netstat', ['-ano', '-p', 'TCP']);
  const lines = output.split(/\r?\n/);
  const pids = new Set();

  for (const line of lines) {
    if (!line.includes(`:${port}`) || !line.includes('LISTENING')) {
      continue;
    }

    const columns = line.trim().split(/\s+/);
    const pid = columns[columns.length - 1];
    if (/^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function getProcessName(pid) {
  try {
    const output = run('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']).trim();
    const firstLine = output.split(/\r?\n/)[0] || '';
    const match = firstLine.match(/^"([^"]+)"/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function killPid(pid, port) {
  run('taskkill', ['/PID', pid, '/T', '/F']);
  console.log(`Stopped process ${pid} using port ${port}.`);
}

if (process.platform !== 'win32') {
  console.log('Skipping dev port cleanup on non-Windows platform.');
  process.exit(0);
}

const occupied = [];

for (const port of ports) {
  const pids = getListeningPids(port);
  if (pids.length > 0) {
    occupied.push({ port, pids });
  }
}

if (occupied.length === 0) {
  console.log('Dev ports are clear.');
  process.exit(0);
}

console.log('Releasing occupied dev ports...');

for (const { port, pids } of occupied) {
  for (const pid of pids) {
    const processName = getProcessName(pid).toLowerCase();
    if (processName && !processName.startsWith('node')) {
      console.log(`Port ${port} is in use by ${processName} (PID ${pid}).`);
      console.log('Stop it manually, then rerun npm run dev.');
      process.exit(1);
    }

    killPid(pid, port);
  }
}

process.exit(0);