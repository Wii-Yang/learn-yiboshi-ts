import { WebDriver } from 'selenium-webdriver'
import User from '../user'
import { createBrowser } from '../browser'
import { login } from './Login'

/**
 * 开始学习
 * @param user
 */
export default async function startLearn(user: User): Promise<void> {
  const browser: WebDriver = await createBrowser()
  await browser.get('http://www.yiboshi.com')
  if (user.token) {
    await browser.executeScript(`localStorage.setItem('www_5HGGWrXN_token', '${user.token}');`)
  }
  if (user.fingerprintID) {
    await browser.executeScript(`localStorage.setItem('FingerprintID', '${user.fingerprintID}');`)
  }
  await browser.get('http://www.yiboshi.com/usercenter/index')
  const url: string = await browser.getCurrentUrl()
  if (url === 'http://www.yiboshi.com/') {
    // 未登录或登录失效
    await login(browser, user)
  }
  console.log(browser)
}
