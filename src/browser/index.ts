import { ServiceBuilder, Options } from 'selenium-webdriver/chrome'
import { Builder, WebDriver } from 'selenium-webdriver'
import { config } from '../utils'
import User from '../user'

/**
 * 创建浏览器
 */
export async function createBrowser(): WebDriver {
  // 获取 chromedriver
  const service: ServiceBuilder = new ServiceBuilder(config.chromedriverFileUrl)

  // 浏览器配置
  const options: Options = new Options()
  options.addArguments('--ignore-certificate-errors')
  options.addArguments('--ignore-ssl-errors')

  const builder: Builder = new Builder()
  builder.forBrowser('chrome')
  builder.setChromeService(service)
  builder.setChromeOptions(options)

  // 创建浏览器实例
  const driver: WebDriver = builder.build()

  // 浏览器窗口最大化
  await driver.manage().window().maximize()

  return driver
}

/**
 * 通过地址创建浏览器
 * @param url
 * @param user
 */
export async function createBrowserByUrl(url: string, user: User): WebDriver {
  const browser: WebDriver = await createBrowser()
  await browser.get('http://www.yiboshi.com/')
  await browser.executeScript(`localStorage.setItem('www_5HGGWrXN_token', '${user.token}');`)
  await browser.executeScript(`localStorage.setItem('FingerprintID', '${user.fingerprintID}');`)
  await browser.get(url)
  return browser
}
