import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { getRedirectURLByButton } from './utils.ts';
import { createBrowserByURL } from '../system/browser.ts';

/**
 * 播放视频
 * @param button
 * @param courseName
 * @param user
 */
export async function playVideo(button: WebElement, courseName: string, user: User): Promise<void> {
  console.log(`开始播放【${courseName}】课程视频`);

  console.log('获取视频网址中......');
  const url: string = await getRedirectURLByButton(button);

  // 打开视频播放页
  const browser: WebDriver = await createBrowserByURL(url, { headless: true, muteAudio: true }, user);

  try {
    console.log('等待视频加载中......');
    await browser.wait(until.elementLocated(By.css('.video_main')));
    await browser.wait(async () => {
      const video_main: WebElement = await browser.findElement(By.css('.video_main'));
      const loading_mask: WebElement = await video_main.findElement(By.css('.el-loading-mask'));
      const display: string = await loading_mask.getCssValue('display');

      if (display === 'none') {
        const vm_list: WebElement[] = await video_main.findElements(By.css('.vm .vm_list .vml_main ul li'));
        return vm_list.length > 0;
      }
      return false;
    });

    // await changeVideoClarity(browser);

    const vm_video: WebElement = await browser.findElement(By.css('.video_main .vm_video'));
    const plyr: WebElement = await vm_video.findElement(By.className('plyr'));

    // 暂停视频
    await plyr.click();
    const plyr_class = await plyr.getAttribute('class');
    if (plyr_class.search('plyr--paused') < 0) {
      await plyr.click();
    }

    const plyr__controls: WebElement = await vm_video.findElement(By.className('plyr__controls'));

    // 点击“静音”按钮
    const plyr__control: WebElement = await plyr__controls.findElement(By.css('.plyr__volume .plyr__control'));
    const plyr__control__style: string = await plyr__control.getAttribute('class');
    if (plyr__control__style.search('plyr__control--pressed') < 0) {
      await plyr__control.click();
    }

    // 播放视频
    await plyr.click();

    // 等待视频播放结束
    await browser.wait(async () => {
      await closeDialog(browser);
      await browser.sleep(1000);

      // 暂停后继续播放
      const plyr: WebElement[] = await browser.findElements(By.className('plyr--paused'));
      if (plyr.length === 1) {
        const plyr__control: WebElement = await browser.findElement(
          By.className('plyr__control plyr__control--overlaid'),
        );
        await plyr__control.click();
      }
      return await isCompleted(browser);
    });
    await browser.sleep(1000 * 2);
    console.log(`完成【${courseName}】课程视频`);
  } catch {
    console.error('\n视频播放过程中出现错误\n');
    throw 'play video';
  } finally {
    await browser.quit();
  }
}

/**
 * 切换清晰度
 * @param browser
 */
export async function changeVideoClarity(browser: WebDriver): Promise<void> {
  // 清晰度
  const vmQingxi: WebElement = await browser.findElement(By.className('vm_qingxi'));
  // 开关
  const elSwitch: WebElement = await vmQingxi.findElement(By.className('el-switch'));
  // 判断是否是高清
  const switchClassName: string = await elSwitch.getAttribute('class');
  if (switchClassName.search('is-checked') >= 0) {
    await elSwitch.click();
  }
}

/**
 * 是否完成
 * @param browser
 */
async function isCompleted(browser: WebDriver): Promise<boolean> {
  const video_dabiao: WebElement = await browser.findElement(By.css('.video_main .vm .vm_star .video_dabiao'));
  const video_dabiao_text: string = await video_dabiao.getText();
  const value: string[] | null = video_dabiao_text.match(/[0-9]{1,3}/g) as string[] | null;
  if (value && value.length === 2) {
    const progressList: number[] = value.map((item: string) => Number(item));
    let progressText: string = `\r视频播放进度：${progressList[1]}/${progressList[0]}`;
    if (progressList[0]! <= progressList[1]!) {
      progressText += '\n';
      process.stdout.write(progressText);
      return true;
    }
    process.stdout.write(progressText);
  }
  return false;
}

/**
 * 关闭对话框
 * @param browser
 */
async function closeDialog(browser: WebDriver): Promise<void> {
  const messageBoxes: WebElement[] = await browser.findElements(By.className('el-message-box__wrapper'));
  for (let i: number = 0; i < messageBoxes.length; i++) {
    const ariaLabel: string = await messageBoxes[i]!.getAttribute('aria-label');
    if (ariaLabel === '温馨提示' || ariaLabel === '提示') {
      const style: string = await messageBoxes[i]!.getAttribute('style');
      if (style.search('display: none') < 0) {
        const messageBoxBtns: WebElement = await messageBoxes[i]!.findElement(By.className('el-message-box__btns'));
        const button: WebElement = await messageBoxBtns.findElement(By.css('button'));
        await button.click();
      }
    }
  }

  const dialogs: WebElement[] = await browser.findElements(By.className('el-dialog__wrapper'));

  for (let i = 0; i < dialogs.length; i++) {
    const style: string = await dialogs[i]!.getAttribute('style');
    if (style.search('display: none') < 0) {
      const dialog = await dialogs[i]!.findElement(By.className('el-dialog'));
      const ariaLabel: string = await dialog.getAttribute('aria-label');
      switch (ariaLabel) {
        case '温馨提示': {
          const button: WebElement = await dialog.findElement(By.className('el-button'));
          await button.click();
          break;
        }
        default:
          console.error('视频播放页出现未处理对话框');
          throw 'exit';
      }
    }
  }
}
