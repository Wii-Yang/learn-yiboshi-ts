import { ServiceBuilder, Options } from 'selenium-webdriver/chrome.js';
import { Builder, WebDriver } from 'selenium-webdriver';

import Config from './config.ts';
import type User from '../user/index.ts';

interface BrowserOptions {
  headless: boolean;
  muteAudio?: boolean;
}

/**
 * 创建浏览器
 * @param options
 */
export async function createBrowser(options: BrowserOptions = { headless: true }): Promise<WebDriver> {
  // 获取 chromedriver
  const service: ServiceBuilder = new ServiceBuilder(Config.ChromedriverPath);

  // 浏览器配置
  const chromeOptions: Options = new Options();
  // 减少在 win 运行时的日志打印
  chromeOptions.addArguments('--log-level=3');
  if (options.headless) {
    chromeOptions.addArguments('--headless');
  }
  if (options.muteAudio) {
    chromeOptions.addArguments('--mute-audio');
  }

  const builder: Builder = new Builder();
  builder.forBrowser('chrome');
  builder.setChromeService(service);
  builder.setChromeOptions(chromeOptions);

  // 创建浏览器实例
  const driver: WebDriver = builder.build();

  // 浏览器窗口最大化
  await driver.manage().window().maximize();

  return driver;
}

export async function createBrowserByURL(url: string, options?: BrowserOptions, user?: User): Promise<WebDriver> {
  const browser = await createBrowser(options);
  if (user) {
    await browser.get(Config.YiboshiURL);
    await browser.executeScript(`localStorage.setItem('www_5HGGWrXN_token', '${user.getToken()}');`);
    await browser.executeScript(`localStorage.setItem('FingerprintID', '${user.getFingerprintID()}');`);
  }
  await browser.get(url);
  return browser;
}
