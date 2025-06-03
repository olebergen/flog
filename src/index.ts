import { spawn } from 'child_process';
import readline from 'node:readline';
import { PassThrough } from 'node:stream';

const [cmd, ...args] = process.argv.slice(2);

const data: string[] = [];
let filter = '';

console.clear();

const child = spawn(cmd, args);

const stream = new PassThrough();
stream.pipe(process.stdout, { end: false });

const rl = readline.createInterface({ input: process.stdin });

const print = (chunk?: unknown) => stream.write(chunk ?? '\n');

const decode = (buf: Buffer) => {
  const lines = buf.toString().split('\n');
  for (let line of lines) {
    if (!line) continue;
    line += '\n';
    data.push(line);

    const withFilter = filter && line.toLowerCase().includes(filter.toLowerCase());
    if (withFilter) print(line);
    else if (!filter) print(line);
  }
};

const render = (arr: string[]) => {
  console.clear();
  for (const line of arr) {
    print(line);
  }
};

rl.prompt();

rl.on('line', (line) => {
  filter = line.trim().toLowerCase();

  if (!filter) render(data);
  else {
    const hits = data.filter((log) => {
      return log.toLowerCase().includes(filter);
    });

    render(hits);
  }

  rl.prompt(); // keep the prompt alive
});

child.stdout.on('data', decode);
child.stderr.on('data', decode);

child.on('error', (err) => process.stderr.write(`error: ${err.message}`));

child.on('close', (code) => {
  process.stdout.write(`closed with code: ${code}`);
});
