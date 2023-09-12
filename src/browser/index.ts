import { ServiceBuilder } from 'selenium-webdriver/chrome'
import { Builder, WebDriver } from 'selenium-webdriver'
import { config } from '../utils'

export async function createBrowser(): WebDriver {
  // 获取 chromedriver
  const service: ServiceBuilder = new ServiceBuilder(config.chromedriverFileUrl)
  // 创建浏览器实例
  const driver: WebDriver = new Builder().forBrowser('chrome').setChromeService(service).build()
  // 浏览器窗口最大化
  await driver.manage().window().maximize()

  return driver
}
