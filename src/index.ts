import { spawn } from 'child_process';
import readline from 'node:readline';

// assuming these are nextjs server logs, for example:
// error: Failed getting draws {"context":"getDraws","error":{},"origin":"https://www.traumhausverlosung.de.localhost:4000","pathname":"/","service":"dhr-frontend","sessionId":"1918d6a1-00aa-40dd-accb-e081b8405c82","timestamp":"2025-05-08 21:57:51.021"}

// stored as parsed javascript objects, if that's too memory intensive store them as strings and parse on demand

// parse toggle with keydown: https://stackoverflow.com/a/55182456/11918503
// logpipe format?: https://logpipe.pages.dev/

type UnknownObject = { [key: string]: unknown };
type LogLine = string | UnknownObject;

console.clear();

const child = spawn('npm', ['run', 'dev:dhr:no-sb']); // todo richtiger cmd

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'filter> ',
});

const data: LogLine[] = [];

// child.stdout.pipe(process.stdout);
// child.stderr.pipe(process.stderr);

const decode = (buf: Buffer) => {
  const lines = buf.toString().split('\n');
  for (const line of lines) {
    try {
      if (line) {
        const parsed = JSON.parse(line);
        data.push(parsed);
      }
    } catch {
      data.push(line);
    }
  }
};

function render(arr: LogLine[]) {
  console.clear();
  for (const line of arr) {
    process.stdout.write(line + '\n');
  }
}

rl.prompt();

rl.on('line', (line) => {
  const term = line.trim();

  if (!term) render(data);
  else {
    const hits = data.filter((log) => {
      if (typeof log === 'string') {
        return log.includes(term);
      }
      return Object.values(log).some((value) => {
        if (typeof value === 'string') return value.includes(term);
        if (typeof value === 'number') return value.toString().includes(term);
        return false;
      });
    });

    render(hits);
  }

  rl.prompt(); // keep the prompt alive
});

child.stdout.on('data', decode);
child.stderr.on('data', decode);

child.on('error', (err) => process.stderr.write(`flog error: ${err.message}`));

child.on('close', (code) => {
  process.stdout.write(`flog closed with code: ${code}`);
});
