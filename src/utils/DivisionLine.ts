import process from 'process'
import { getStrLength } from './index'

function consoleDivisionLine(): void {
  const chart: string = '*'
  let divisionLine: string = ''
  for (let i: number = 0; i < 80; i++) {
    divisionLine += chart
  }
  console.log(divisionLine)
}

function consoleDivisionLineByText(text: string): void {
  consoleDivisionLine()
  const blankLength: number = Math.floor((80 - getStrLength(text)) / 2)
  for (let i = 0; i < blankLength; i++) {
    process.stdout.write(' ')
  }
  process.stdout.write(text)
  for (let i = 0; i < blankLength; i++) {
    process.stdout.write(' ')
  }
  process.stdout.write('\n')
  consoleDivisionLine()
}

export { consoleDivisionLine, consoleDivisionLineByText }
