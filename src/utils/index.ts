import * as config from './Config'
import * as divisionLint from './DivisionLine'
import * as readline from './ReadlineSync'

function getStrLength(str: string): number {
  let len: number = str.length
  for (let i: number = 0; i < str.length; i++) {
    const c: number = str.charCodeAt(i)
    // 中文字符的Unicode编码值范围
    if (c >= 0x4e00 && c <= 0x9fa5) {
      len += 1
    }
  }
  return len
}

export { getStrLength, config, divisionLint, readline }
