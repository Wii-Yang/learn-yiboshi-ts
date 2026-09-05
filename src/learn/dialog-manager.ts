import { By, error, type WebDriver, type WebElement } from 'selenium-webdriver';

export interface DialogHandlerOptions {
  onVisibleDialog?: (label: string, text: string) => Promise<boolean> | boolean;
  onVisibleMessageBox?: (label: string, text: string) => Promise<boolean> | boolean;
}

const CONFIRM_WORDS = /同意|确认|确定|知道了|继续|已阅读|关闭/;
const SAFE_LABELS = /^(提示|温馨提示)$/;
const NOTICE_WORDS = /知情通知|用户协议|隐私政策/;
// “继续上次观看课程”弹窗默认按钮是“继续学习”，会打断当前入口的原有动作，必须点“否”
const RESUME_LAST_COURSE_WORDS = /上次观看到的课程|是否继续学习/;

export async function closeDialogs(browser: WebDriver, options: DialogHandlerOptions = {}): Promise<void> {
  const messageBoxes = await browser.findElements(By.className('el-message-box__wrapper'));
  for (const box of messageBoxes) {
    if (!(await isVisible(box))) continue;
    const label = (await box.getAttribute('aria-label')) || '';
    const text = await box.getText();
    if (await options.onVisibleMessageBox?.(label, text)) continue;
    if (await handleResumeLastCourseDialog(browser, box)) continue;
    if (!SAFE_LABELS.test(label) && !CONFIRM_WORDS.test(text)) {
      throwUnhandled('消息框', label, text);
    }
    await clickBestButton(browser, box);
  }

  const dialogs = await browser.findElements(By.className('el-dialog__wrapper'));
  for (const wrapper of dialogs) {
    if (!(await isVisible(wrapper))) continue;
    const dialog = await wrapper.findElement(By.className('el-dialog'));
    const label = (await dialog.getAttribute('aria-label')) || '';
    const text = await dialog.getText();
    if (await options.onVisibleDialog?.(label, text)) continue;
    if (await handleResumeLastCourseDialog(browser, dialog)) continue;
    if (SAFE_LABELS.test(label) || NOTICE_WORDS.test(`${label} ${text}`)) {
      await checkFirstUnchecked(browser, dialog);
      await clickBestButton(browser, dialog);
      continue;
    }
    throwUnhandled('对话框', label, text);
  }

  await waitHidden(browser);
}

async function handleResumeLastCourseDialog(browser: WebDriver, container: WebElement): Promise<boolean> {
  const text = await container.getText();
  if (!RESUME_LAST_COURSE_WORDS.test(text)) {
    return false;
  }

  // 勾选“记住选择，不再提示”，避免同一弹窗反复打断后续入口点击
  await checkFirstUnchecked(browser, container);

  const buttons = await container.findElements(
    By.css('.el-dialog__footer button, .el-message-box__btns button, button'),
  );
  let fallbackButton: WebElement | undefined;
  for (const button of buttons) {
    if (!(await isVisible(button))) continue;
    const buttonText = ((await button.getText()) || '').trim();
    if (buttonText === '否' || buttonText.startsWith('否')) {
      await safeClick(browser, button);
      console.log('已处理“继续上次观看课程”弹窗：选择否');
      return true;
    }
    fallbackButton ||= button;
  }

  if (fallbackButton) {
    await safeClick(browser, fallbackButton);
    console.log('已处理“继续上次观看课程”弹窗：未找到“否”按钮，点击首个可见按钮');
    return true;
  }

  return false;
}

async function checkFirstUnchecked(browser: WebDriver, dialog: WebElement): Promise<void> {
  const candidates = await dialog.findElements(By.css('input[type="checkbox"], .el-checkbox'));
  for (const candidate of candidates) {
    if (!(await isVisible(candidate))) continue;
    const checked = (await candidate.getAttribute('checked')) === 'true';
    const className = (await candidate.getAttribute('class')) || '';
    if (!checked && !className.includes('is-checked')) {
      await safeClick(browser, candidate);
      return;
    }
  }
}

async function clickBestButton(browser: WebDriver, container: WebElement): Promise<void> {
  const buttons = await container.findElements(
    By.css('.el-dialog__footer button, .el-message-box__btns button, button'),
  );
  const visible: WebElement[] = [];
  for (const button of buttons) if (await isVisible(button)) visible.push(button);
  if (visible.length === 0) throw new Error('弹窗未找到可见操作按钮');
  for (const button of visible) {
    const text = ((await button.getText()) || (await button.getAttribute('value')) || '').trim();
    if (CONFIRM_WORDS.test(text)) {
      await safeClick(browser, button);
      return;
    }
  }
  await safeClick(browser, visible[visible.length - 1]!);
}

async function isVisible(element: WebElement): Promise<boolean> {
  return (await element.getCssValue('display')) !== 'none' && (await element.isDisplayed());
}

function throwUnhandled(kind: string, label: string, text: string): never {
  const normalized = text.replace(/\s+/g, ' ').trim().slice(0, 300);
  console.error(`程序运行中出现未处理的${kind}：${label || normalized}`);
  console.error(`弹窗正文：${normalized}`);
  throw 'exit';
}

async function safeClick(browser: WebDriver, element: WebElement): Promise<void> {
  try {
    await browser.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" });', element);
    await element.click();
  } catch (clickError) {
    if (
      clickError instanceof error.ElementNotInteractableError ||
      clickError instanceof error.ElementClickInterceptedError
    ) {
      await browser.actions({ async: true }).move({ origin: element }).click().perform();
      return;
    }
    throw clickError;
  }
}

async function waitHidden(browser: WebDriver): Promise<void> {
  try {
    await browser.wait(async () => {
      const overlays = await browser.findElements(By.css('.el-dialog__wrapper,.el-message-box__wrapper'));
      for (const overlay of overlays) if (await isVisible(overlay)) return false;
      return true;
    }, 5000);
  } catch {
    // Dialog animations may leave hidden nodes behind.
  }
}
