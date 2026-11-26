import { Driver, ServiceBuilder, Options } from 'selenium-webdriver/chrome.js';
import type { WebDriver } from 'selenium-webdriver';
import type { DriverService } from 'selenium-webdriver/remote.js';

import Config from './config.ts';
import type User from '../user/index.ts';

interface BrowserOptions {
  headless: boolean;
  muteAudio?: boolean;
}

const browserServices = new WeakMap<WebDriver, DriverService>();
const BROWSER_QUIT_TIMEOUT_MS = 1000 * 15;

/**
 * 创建浏览器
 * @param options
 */
export async function createBrowser(options: BrowserOptions = { headless: true }): Promise<WebDriver> {
  // 获取 chromedriver
  const serviceBuilder: ServiceBuilder = new ServiceBuilder(Config.ChromedriverPath);
  // 屏蔽 chromedriver 进程的输出，避免把 Chrome 后台日志(如 GCM)刷进终端
  serviceBuilder.setStdio('ignore');

  // 浏览器配置
  const chromeOptions: Options = new Options();
  // 减少在 win 运行时的日志打印
  chromeOptions.addArguments('--log-level=3');
  chromeOptions.addArguments('--disable-background-networking');
  chromeOptions.addArguments('--disable-sync');
  chromeOptions.addArguments('--disable-component-update');
  chromeOptions.addArguments('--autoplay-policy=no-user-gesture-required');
  chromeOptions.addArguments('--disable-background-timer-throttling');
  chromeOptions.addArguments('--disable-backgrounding-occluded-windows');
  chromeOptions.addArguments('--disable-renderer-backgrounding');
  chromeOptions.addArguments('--window-size=1600,1000');
  if (options.headless) {
    chromeOptions.addArguments('--headless=new');
  }
  if (options.muteAudio) {
    chromeOptions.addArguments('--mute-audio');
  }

  const service = serviceBuilder.build();
  const driver: WebDriver = Driver.createSession(chromeOptions, service);
  browserServices.set(driver, service);

  // 浏览器窗口最大化
  await driver.manage().window().maximize();

  return driver;
}

export async function quitBrowser(browser: WebDriver): Promise<void> {
  const service = browserServices.get(browser);
  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      browser.quit(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('浏览器关闭超时')), BROWSER_QUIT_TIMEOUT_MS);
      }),
    ]);
  } catch (quitError) {
    console.error('浏览器未正常关闭，正在清理残留进程', quitError);
    await service?.kill();
  } finally {
    if (timeout) clearTimeout(timeout);
    browserServices.delete(browser);
  }
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
