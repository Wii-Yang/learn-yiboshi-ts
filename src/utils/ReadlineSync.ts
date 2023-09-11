import readline from 'readline'

function readlineSync(): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.on('line', data => {
      rl.close()
      resolve(data)
    })
  })
}

export { readlineSync }
