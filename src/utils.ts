import * as readline from 'node:readline';

// 控制台输入
export function readlineSync(question?: string): Promise<string> {
  const rl: readline.Interface = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (question) {
    return new Promise((resolve: (data: string) => void): void => {
      rl.question(question, (line: string): void => {
        rl.close();
        resolve(line);
      });
    });
  }

  return new Promise((resolve: (data: string) => void): void => {
    rl.on('line', (data: string): void => {
      rl.close();
      resolve(data);
    });
  });
}
