import type { WebDriver, WebElement } from 'selenium-webdriver';

export async function getRedirectURLByButton(button: WebElement): Promise<string> {
  const browser: WebDriver = button.getDriver();

  // 当前窗口
  const currentWindowHandle: string = await browser.getWindowHandle();
  // 跳转前所有窗口
  const beforeAllWindowHandles: string[] = await browser.getAllWindowHandles();

  // 跳转
  await browser.executeScript('arguments[0].scrollIntoView(false);', button);
  await button.click();

  // 跳转后所有窗口
  const afterAllWindowHandles: string[] = await browser.getAllWindowHandles();

  // 跳转窗口
  const redirectWindowHandle: string = afterAllWindowHandles.find(
    (item: string) => !beforeAllWindowHandles.includes(item),
  )!;

  // 切换到跳转后到页面
  await browser.switchTo().window(redirectWindowHandle);

  // 获取到跳转后网址
  const redirectURL: string = await browser.getCurrentUrl();

  // 浏览器关闭跳转后窗口
  await browser.close();
  // 浏览器切换到跳转前窗口
  await browser.switchTo().window(currentWindowHandle);

  return redirectURL;
}
