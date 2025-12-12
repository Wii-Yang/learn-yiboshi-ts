import type User from '../user/index.ts';
import { createBrowserByURL } from './browser.ts';
import Config from './config.ts';
import { By, until, type WebDriver, WebElement } from 'selenium-webdriver';

/**
 * 登录账号
 * @param user
 */
async function loginUser(user: User): Promise<void> {
  console.log('【打开登录页】');
  const browser: WebDriver = await createBrowserByURL(Config.YiboshiURL, { headless: false });

  try {
    // 获取 new_login_box
    const newLoginBox: WebElement = await browser.wait(until.elementLocated(By.className('new_login_box')));

    // 获取 nlb_main
    const nlbMainList: WebElement[] = await newLoginBox.findElements(By.className('nlb_main'));
    const nlbMain: WebElement = nlbMainList[0]!;

    // 获取 nlb_input
    const nlbInputList: WebElement[] = await nlbMain.findElements(By.className('nlb_input'));

    console.log('【输入用户名】');
    await nlbInputList[0]!.findElement(By.tagName('input')).sendKeys(user.getUsername());
    console.log('【输入密码】');
    await nlbInputList[1]!.findElement(By.tagName('input')).sendKeys(user.getPassword());

    // 获取 nlb_useragreenment
    const nlbUseragreenment: WebElement = await nlbMain.findElement(By.className('nlb_useragreenment'));
    // 获取 el-checkbox
    const elCheckbox: WebElement = await nlbUseragreenment.findElement(By.className('el-checkbox'));
    console.log('【勾选复选框】');
    await elCheckbox.click();

    // 获取 nlb_btn
    const nlbBtn: WebElement = await nlbMain.findElement(By.className('nlb_btn'));
    console.log(`【登录】`);
    await nlbBtn.click();

    // 等待手动完成验证
    console.log('请手动完成验证，等待中......');
    await browser.wait(async (): Promise<boolean> => {
      const verifyMain: WebElement[] = await browser.findElements(By.className('verifyMain'));
      return verifyMain.length === 0;
    });

    console.log('【获取 name】');
    const nameInput = await browser.wait(until.elementLocated(By.id('name')), 1000 * 10);
    const name = await nameInput.getAttribute('value');
    user.setName(name);

    console.log('【获取 token】');
    const token: string = await browser.executeScript('return localStorage.getItem("www_5HGGWrXN_token");');
    user.setToken(token);

    console.log('【获取 fingerprintID】');
    const fingerprintID: string = await browser.executeScript('return localStorage.getItem("FingerprintID");');
    user.setFingerprint(fingerprintID);

    await browser.quit();

    console.log('【登录成功】');
  } catch {
    console.error('登录失败');
    await browser.quit();
    throw 'login error';
  }
}

/**
 * 判断当前用户是否登录
 * @param user
 */
export async function isLogin(user: User): Promise<boolean> {
  const url: string = Config.YiboshiURL + '/usercenter/index';

  const browser: WebDriver = await createBrowserByURL(url, undefined, user);

  // 刷新网页
  await browser.navigate().refresh();

  // 刷新后的网址
  const currentUrl: string = await browser.getCurrentUrl();

  // 关闭网页
  await browser.quit();

  return currentUrl === url;
}

export default loginUser;
