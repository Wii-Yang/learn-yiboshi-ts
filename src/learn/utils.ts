import { By, type WebDriver, type WebElement } from 'selenium-webdriver';

/**
 * 获取跳转后网址
 * @param button
 */
export async function getRedirectURLByButton(button: WebElement): Promise<string> {
  const browser: WebDriver = button.getDriver();

  // 当前窗口
  const currentWindowHandle: string = await browser.getWindowHandle();
  // 跳转前所有窗口
  const beforeAllWindowHandles: string[] = await browser.getAllWindowHandles();

  // 跳转
  await browser.executeScript('arguments[0].scrollIntoView(false);', button);
  await button.click();

  await browser.wait(async () => {
    const newHandles = await browser.getAllWindowHandles();
    return newHandles.length > beforeAllWindowHandles.length;
  });

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

/**
 * 关闭对话框
 * @param browser
 */
export async function closeDialog(browser: WebDriver): Promise<void> {
  const dialog_list: WebElement[] = await browser.findElements(By.className('el-dialog__wrapper'));

  for (let i: number = 1; i < dialog_list.length; i++) {
    const dialog: WebElement = dialog_list[i]!;
    const display: string = await dialog.getCssValue('display');
    if (display !== 'none') {
      const el_dialog: WebElement = await dialog.findElement(By.className('el-dialog'));
      const aria_label: string = await el_dialog.getAttribute('aria-label');
      switch (aria_label) {
        case '提示': {
          // 勾选“记住选择，不再提示”复选框
          const checkbox: WebElement = await el_dialog.findElement(
            By.css('.el-dialog__body .dialog_content .dialog_content_message .el-checkbox'),
          );
          await checkbox.click();

          // 点击“否”按钮
          const button: WebElement = await el_dialog.findElement(
            By.css('.el-dialog__footer .dialog-footer .el-button--default'),
          );
          await button.click();
          break;
        }
        default:
          console.error('程序运行中出现未处理的对话框');
          throw 'exit';
      }
    }
  }
}
