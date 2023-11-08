import { WebDriver, WebElement, By, until } from 'selenium-webdriver'
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

async function waitAndCloseDialog(browser: WebDriver): Promise<void> {
  await browser.sleep(1000 * 2)

  // 判断是否有弹窗
  const dialog: WebElement = await browser.findElement(By.className('el-dialog__wrapper dialog_'))
  const style: string = await dialog.getAttribute('style')
  if (style.search('display: none;') < 0) {
    // 等待弹窗加载完成
    await browser.wait(
      until.elementLocated(By.className('el-button el-button--small el-button--default'))
    )
    // 当弹窗打开时关闭弹窗
    const dialogFooter: WebElement = await dialog.findElement(By.className('el-dialog__footer'))
    const closeButton: WebElement = await dialogFooter.findElement(
      By.className('el-button el-button--small el-button--default')
    )
    await closeButton.click()
  }
}

export { getStrLength, config, divisionLint, readline, waitAndCloseDialog }
