import { By, error, type WebDriver, type WebElement } from 'selenium-webdriver';

/**
 * 获取跳转后网址
 * @param button
 */
export async function getRedirectURLByButton(button: WebElement): Promise<string> {
  const browser: WebDriver = button.getDriver();
  const clickTargets: WebElement[] = await button.findElements(By.css('a,button,input'));
  const clickTarget: WebElement = clickTargets[0] || button;
  const clickText: string = (await clickTarget.getText()) || (await clickTarget.getAttribute('value')) || '';

  // 当前窗口
  const currentWindowHandle: string = await browser.getWindowHandle();
  // 跳转前所有窗口
  const beforeAllWindowHandles: string[] = await browser.getAllWindowHandles();
  const beforeURL: string = await browser.getCurrentUrl();

  // 跳转
  await closeDialog(browser);
  await browser.executeScript('arguments[0].scrollIntoView(false);', clickTarget);
  console.log(`点击跳转入口：${clickText || '未知按钮'}`);
  await safeClick(browser, clickTarget);

  try {
    await browser.wait(async (): Promise<boolean> => {
      const newHandles = await browser.getAllWindowHandles();
      if (newHandles.length > beforeAllWindowHandles.length) {
        return true;
      }

      const currentURL: string = await browser.getCurrentUrl();
      return currentURL !== beforeURL;
    }, 1000 * 20);
  } catch (error) {
    await logRedirectDebug(browser, clickTarget, beforeAllWindowHandles.length);
    throw error;
  }

  // 跳转后所有窗口
  const afterAllWindowHandles: string[] = await browser.getAllWindowHandles();

  if (afterAllWindowHandles.length === beforeAllWindowHandles.length) {
    const redirectURL: string = await browser.getCurrentUrl();
    await browser.navigate().back();
    await browser.wait(async () => (await browser.getCurrentUrl()) === beforeURL, 1000 * 10);
    return redirectURL;
  }

  // 跳转窗口
  const redirectWindowHandle: string = afterAllWindowHandles.find(
    (item: string) => !beforeAllWindowHandles.includes(item),
  )!;

  // 切换到跳转后到页面
  await browser.switchTo().window(redirectWindowHandle);

  // 获取到跳转后网址
  await browser.wait(async () => {
    const redirectURL: string = await browser.getCurrentUrl();
    return redirectURL && redirectURL !== 'about:blank';
  }, 1000 * 10);
  const redirectURL: string = await browser.getCurrentUrl();

  // 浏览器关闭跳转后窗口
  await browser.close();
  // 浏览器切换到跳转前窗口
  await browser.switchTo().window(currentWindowHandle);

  return redirectURL;
}

async function logRedirectDebug(browser: WebDriver, clickTarget: WebElement, beforeWindowCount: number): Promise<void> {
  const currentURL: string = await browser.getCurrentUrl();
  const windowHandles: string[] = await browser.getAllWindowHandles();
  console.error(`跳转失败：窗口数量 ${beforeWindowCount} -> ${windowHandles.length}，当前地址：${currentURL}`);

  try {
    console.error('跳转目标元素：', {
      text: await clickTarget.getText(),
      href: await clickTarget.getAttribute('href'),
      className: await clickTarget.getAttribute('class'),
      disabled: await clickTarget.getAttribute('disabled'),
      displayed: await clickTarget.isDisplayed(),
      enabled: await clickTarget.isEnabled(),
    });
  } catch (targetError) {
    console.error('读取跳转目标元素信息失败', targetError);
  }

  const messageBoxes: WebElement[] = await browser.findElements(By.className('el-message-box__wrapper'));
  for (let i = 0; i < messageBoxes.length; i++) {
    const display: string = await messageBoxes[i]!.getCssValue('display');
    if (display !== 'none') {
      console.error(`可见消息框：${await messageBoxes[i]!.getText()}`);
    }
  }

  const dialogs: WebElement[] = await browser.findElements(By.className('el-dialog__wrapper'));
  for (let i = 0; i < dialogs.length; i++) {
    const display: string = await dialogs[i]!.getCssValue('display');
    if (display !== 'none') {
      console.error(`可见对话框：${await dialogs[i]!.getText()}`);
    }
  }
}

/**
 * 关闭对话框
 * @param browser
 */
export async function closeDialog(browser: WebDriver): Promise<void> {
  const message_box_list: WebElement[] = await browser.findElements(By.className('el-message-box__wrapper'));
  for (let i = 0; i < message_box_list.length; i++) {
    const message_box: WebElement = message_box_list[i]!;
    const display: string = await message_box.getCssValue('display');
    if (display === 'none') {
      continue;
    }

    const aria_label: string = await message_box.getAttribute('aria-label');
    if (aria_label === '提示' || aria_label === '温馨提示') {
      const button_list: WebElement[] = await message_box.findElements(By.css('.el-message-box__btns button'));
      const visibleButtons = await getVisibleElements(button_list);
      if (visibleButtons.length > 0) {
        await safeClick(browser, visibleButtons[0]!);
      }
      continue;
    }

    console.error(`程序运行中出现未处理的消息框：${aria_label}`);
    throw 'exit';
  }

  const dialog_list: WebElement[] = await browser.findElements(By.className('el-dialog__wrapper'));

  for (let i: number = 0; i < dialog_list.length; i++) {
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
          await safeClick(browser, checkbox);

          // 点击“否”按钮
          const button: WebElement = await el_dialog.findElement(
            By.css('.el-dialog__footer .dialog-footer .el-button--default'),
          );
          await safeClick(browser, button);
          break;
        }
        default:
          console.error(`程序运行中出现未处理的对话框：${aria_label}`);
          throw 'exit';
      }
    }
  }

  await waitDialogHidden(browser);
}

async function getVisibleElements(elements: WebElement[]): Promise<WebElement[]> {
  const visibleElements: WebElement[] = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
    if (await element.isDisplayed()) {
      visibleElements.push(element);
    }
  }
  return visibleElements;
}

async function safeClick(browser: WebDriver, element: WebElement): Promise<void> {
  try {
    await browser.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" });', element);
    await element.click();
  } catch (clickError) {
    if (isClickFallbackError(clickError)) {
      await browser.actions({ async: true }).move({ origin: element }).click().perform();
      return;
    }
    throw clickError;
  }
}

function isClickFallbackError(clickError: unknown): boolean {
  return (
    clickError instanceof error.ElementNotInteractableError ||
    clickError instanceof error.ElementClickInterceptedError ||
    (clickError instanceof Error &&
      (clickError.name === 'ElementNotInteractableError' || clickError.name === 'ElementClickInterceptedError'))
  );
}

async function waitDialogHidden(browser: WebDriver): Promise<void> {
  try {
    await browser.wait(async () => {
      const overlays: WebElement[] = await browser.findElements(
        By.css('.el-dialog__wrapper,.el-message-box__wrapper'),
      );

      for (let i = 0; i < overlays.length; i++) {
        const display: string = await overlays[i]!.getCssValue('display');
        if (display !== 'none') {
          return false;
        }
      }

      return true;
    }, 1000 * 5);
  } catch {
    // Some pages keep hidden dialog nodes around during animation; the next click will still use visible UI controls.
  }
}
