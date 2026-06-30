import { By, error, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { getRedirectURLByButton } from './utils.ts';
import { createBrowserByURL } from '../system/browser.ts';
import { logLive } from '../system/logger.ts';

let lastActiveVideoName = '';
let lastPlaybackLogTime = 0;
let lastVideoCurrentTime = 0;
let lastVideoCurrentTimeCheck = 0;
let lastStallResumeTime = 0;
let lastProgressChangeTime = 0;
let lastProgressCompleted = 0;
let lastProgressRecoveryTime = 0;

const VIDEO_PAGE_LOAD_TIMEOUT_MS = 1000 * 60 * 2;

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

  let lastPlayError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    // 打开视频播放页
    const browser: WebDriver = await createBrowserByURL(url, { headless: true, muteAudio: true }, user);

    try {
      console.log('等待视频加载中......');
      await browser.wait(until.elementLocated(By.css('.video_main')), VIDEO_PAGE_LOAD_TIMEOUT_MS);
      await browser.wait(async () => {
        const video_main: WebElement = await browser.findElement(By.css('.video_main'));
        const loading_mask: WebElement = await video_main.findElement(By.css('.el-loading-mask'));
        const display: string = await loading_mask.getCssValue('display');

        if (display === 'none') {
          const vm_list: WebElement[] = await video_main.findElements(By.css('.vm .vm_list .vml_main ul li'));
          return vm_list.length > 0;
        }
        return false;
      }, VIDEO_PAGE_LOAD_TIMEOUT_MS);

      // await changeVideoClarity(browser);

      await browser.findElement(By.css('.video_main .vm_video .plyr'));
      await muteVideo(browser);

      // 播放视频
      await waitInitialPlayback(browser);

      // 等待视频播放结束
      lastActiveVideoName = '';
      lastPlaybackLogTime = 0;
      lastVideoCurrentTime = 0;
      lastVideoCurrentTimeCheck = Date.now();
      lastStallResumeTime = 0;
      lastProgressChangeTime = Date.now();
      lastProgressCompleted = 0;
      lastProgressRecoveryTime = 0;
      await browser.wait(async () => {
        try {
          await closeDialog(browser);
          await browser.sleep(1000);

          // 暂停后继续播放
          const plyr: WebElement[] = await browser.findElements(By.className('plyr--paused'));
          if (plyr.length === 1) {
            await playCurrentVideo(browser);
          }
          await logActiveVideo(browser);
          await logPlaybackHeartbeat(browser);
          return await isCompleted(browser);
        } catch (waitError) {
          if (isStaleElementError(waitError)) {
            return false;
          }
          throw waitError;
        }
      });
      console.log(`完成【${courseName}】课程视频`);
      return;
    } catch (playError) {
      lastPlayError = playError;
      console.error(`\n视频播放过程中出现错误（第 ${attempt} 次）\n`, playError);
      if (attempt < 2) {
        logLive('播放恢复：重启隐藏浏览器后重试视频播放');
      }
    } finally {
      await browser.quit();
    }
  }

  console.error('视频播放重试后仍失败', lastPlayError);
  throw 'play video';
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
    const completedProgress = progressList[1]!;
    if (completedProgress !== lastProgressCompleted) {
      lastProgressCompleted = completedProgress;
      lastProgressChangeTime = Date.now();
    }

    if (progressList[0]! <= progressList[1]!) {
      await browser.sleep(2000);
      return true;
    }
  }
  return false;
}

async function logActiveVideo(browser: WebDriver): Promise<void> {
  try {
    const videoItems: WebElement[] = await browser.findElements(By.css('.vm .vm_list .vml_main ul li'));
    let activeVideo: WebElement | undefined;

    for (let i = 0; i < videoItems.length; i++) {
      const videoItem = videoItems[i]!;
      const className: string = await videoItem.getAttribute('class');
      if (/(^|\s)(active|on|current|selected|is-active|vmlm_ing)(\s|$)/.test(className)) {
        activeVideo = videoItem;
        break;
      }
    }

    if (!activeVideo) {
      return;
    }

    const activeVideoName: string = formatActiveVideoName(await activeVideo.getText());
    if (activeVideoName && activeVideoName !== lastActiveVideoName) {
      logLive(`正在播放视频：${activeVideoName}`);
      lastActiveVideoName = activeVideoName;
    }
  } catch (activeVideoError) {
    if (!isStaleElementError(activeVideoError)) {
      throw activeVideoError;
    }
  }
}

function formatActiveVideoName(videoText: string): string {
  return videoText
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*/, '');
}

async function logPlaybackHeartbeat(browser: WebDriver): Promise<void> {
  const playbackState = await getPlaybackState(browser);
  if (!playbackState) {
    return;
  }

  const now = Date.now();
  const isAdvancing = playbackState.currentTime > lastVideoCurrentTime + 1;
  if (isAdvancing) {
    lastVideoCurrentTime = playbackState.currentTime;
    lastVideoCurrentTimeCheck = now;
  }

  if (!playbackState.ended && !isAdvancing && now - lastVideoCurrentTimeCheck > 1000 * 120) {
    if (now - lastStallResumeTime > 1000 * 60) {
      await recoverVideo(browser, `视频时间未推进：${formatSeconds(playbackState.currentTime)}/${formatSeconds(playbackState.duration)}`);
      lastStallResumeTime = now;
    }
  }

  const progressStaleThresholdMs = getProgressStaleThresholdMs(playbackState.duration);
  if (
    !playbackState.ended &&
    now - lastProgressChangeTime > progressStaleThresholdMs &&
    now - lastProgressRecoveryTime > progressStaleThresholdMs
  ) {
    await recoverVideo(
      browser,
      `平台达标进度超过 ${formatDuration(progressStaleThresholdMs)} 未变化：${formatSeconds(playbackState.currentTime)}/${formatSeconds(playbackState.duration)}`,
    );
    lastProgressRecoveryTime = now;
    lastProgressChangeTime = now;
  }

  if (now - lastPlaybackLogTime < 1000 * 60) {
    return;
  }

  const progressText = await getProgressText(browser);
  logLive(
    `视频播放中：${formatSeconds(playbackState.currentTime)}/${formatSeconds(playbackState.duration)}，${progressText}`,
  );
  lastPlaybackLogTime = now;
}

async function getPlaybackState(browser: WebDriver): Promise<
  | {
      currentTime: number;
      duration: number;
      paused: boolean;
      ended: boolean;
    }
  | undefined
> {
  return await browser.executeScript(`
    const video = document.querySelector('video');
    if (!video) return undefined;
    return {
      currentTime: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      paused: video.paused,
      ended: video.ended
    };
  `);
}

async function getProgressText(browser: WebDriver): Promise<string> {
  const progressElements: WebElement[] = await browser.findElements(By.css('.video_main .vm .vm_star .video_dabiao'));
  if (progressElements.length <= 0) {
    return '达标进度未知';
  }

  const progressText: string = await progressElements[0]!.getText();
  const value: string[] | null = progressText.match(/[0-9]{1,3}/g) as string[] | null;
  if (value && value.length === 2) {
    return `达标进度：${value[1]}/${value[0]}`;
  }

  return progressText.replace(/\s+/g, ' ').trim();
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const restSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
}

function getProgressStaleThresholdMs(duration: number): number {
  const minThresholdMs = 1000 * 60 * 5;
  const maxThresholdMs = 1000 * 60 * 20;

  if (!Number.isFinite(duration) || duration <= 0) {
    return minThresholdMs;
  }

  // The site reports integer percentages, so long videos can legitimately take a while before the next percent appears.
  const fourPercentDurationMs = duration * 0.04 * 1000;
  return Math.min(maxThresholdMs, Math.max(minThresholdMs, fourPercentDurationMs));
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return `${minutes} 分钟`;
  }
  return `${minutes} 分 ${seconds} 秒`;
}

async function muteVideo(browser: WebDriver): Promise<void> {
  await browser.executeScript(`
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.muted = true;
      video.volume = 0;
    });
  `);

  const muteButtons: WebElement[] = await browser.findElements(
    By.css('.video_main .vm_video .plyr__controls .plyr__volume .plyr__control'),
  );
  if (muteButtons.length <= 0) {
    return;
  }

  const muteButton: WebElement = muteButtons[0]!;
  const muteButtonClass: string = await muteButton.getAttribute('class');
  if (muteButtonClass.search('plyr__control--pressed') < 0) {
    await safeClick(browser, muteButton);
  }
}

async function waitInitialPlayback(browser: WebDriver): Promise<void> {
  try {
    await browser.wait(async () => {
      const playbackState = await getPlaybackState(browser);
      return !!playbackState && !playbackState.paused && !playbackState.ended;
    }, 1000 * 15);
  } catch {
    logLive('播放器未自动播放，尝试点击播放器 UI');
    await playCurrentVideo(browser);
  }
}

async function playCurrentVideo(browser: WebDriver, diagnoseBeforeClick = false): Promise<void> {
  const isPlaying: boolean = await browser.executeScript(`
    const video = document.querySelector('video');
    return !!video && !video.paused && !video.ended;
  `);
  if (isPlaying) {
    return;
  }

  if (diagnoseBeforeClick) {
    await logVideoDiagnostics(browser, '播放器处于暂停状态，尝试通过 UI 恢复播放');
  }

  const playButtons: WebElement[] = await browser.findElements(By.css('.plyr__control.plyr__control--overlaid'));
  if (playButtons.length > 0) {
    await safeClick(browser, playButtons[0]!);
    await assertUiPlaybackStarted(browser);
    return;
  }

  const plyrList: WebElement[] = await browser.findElements(By.css('.video_main .vm_video .plyr'));
  if (plyrList.length > 0) {
    await safeClick(browser, plyrList[0]!);
    await assertUiPlaybackStarted(browser);
    return;
  }

  await logVideoDiagnostics(browser, '未找到可点击的播放器 UI');
  throw new Error('未找到可点击的播放器 UI');
}

async function assertUiPlaybackStarted(browser: WebDriver): Promise<void> {
  try {
    await browser.wait(async () => {
      await closeDialog(browser);
      const playbackState = await getPlaybackState(browser);
      return !!playbackState && !playbackState.paused && !playbackState.ended;
    }, 1000 * 10);
  } catch (playbackError) {
    await logVideoDiagnostics(browser, '点击播放器 UI 后仍未播放');
    throw playbackError;
  }
}

async function recoverVideo(browser: WebDriver, reason: string): Promise<void> {
  logLive(`播放恢复：${reason}`);
  await logVideoDiagnostics(browser, reason);

  try {
    await playCurrentVideo(browser, true);
    return;
  } catch (uiError) {
    console.error('通过播放器 UI 恢复失败，刷新播放页后重试', uiError);
  }

  logLive('播放恢复：刷新播放页并重新点击播放器 UI');
  await browser.navigate().refresh();
  await browser.wait(until.elementLocated(By.css('.video_main')), VIDEO_PAGE_LOAD_TIMEOUT_MS);
  await browser.wait(async () => {
    const videoMain: WebElement = await browser.findElement(By.css('.video_main'));
    const loadingMasks: WebElement[] = await videoMain.findElements(By.css('.el-loading-mask'));
    if (loadingMasks.length > 0 && (await loadingMasks[0]!.getCssValue('display')) !== 'none') {
      return false;
    }
    const videoList: WebElement[] = await videoMain.findElements(By.css('.vm .vm_list .vml_main ul li'));
    return videoList.length > 0;
  }, VIDEO_PAGE_LOAD_TIMEOUT_MS);

  await closeDialog(browser);
  await muteVideo(browser);
  await playCurrentVideo(browser);
  lastPlaybackLogTime = 0;
  lastVideoCurrentTime = 0;
  lastVideoCurrentTimeCheck = Date.now();
}

async function logVideoDiagnostics(browser: WebDriver, reason: string): Promise<void> {
  const diagnostics = await browser.executeScript(`
    const video = document.querySelector('video');
    const progress = document.querySelector('.video_main .vm .vm_star .video_dabiao');
    const player = document.querySelector('.video_main .vm_video .plyr');
    const activeVideos = [...document.querySelectorAll('.vm .vm_list .vml_main ul li')]
      .map((li, index) => ({ index, text: li.innerText, className: li.className }))
      .filter((item) => item.className);
    const dialogs = [...document.querySelectorAll('.el-dialog__wrapper,.el-message-box__wrapper')]
      .map((dialog) => ({ display: getComputedStyle(dialog).display, className: dialog.className, text: dialog.innerText.slice(0, 200) }))
      .filter((dialog) => dialog.display !== 'none');
    return {
      url: location.href,
      title: document.title,
      progressText: progress ? progress.innerText : '',
      playerClass: player ? player.className : '',
      video: video ? {
        paused: video.paused,
        ended: video.ended,
        currentTime: video.currentTime || 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        readyState: video.readyState,
        networkState: video.networkState,
        muted: video.muted,
        error: video.error ? { code: video.error.code, message: video.error.message } : null
      } : null,
      activeVideos,
      visibleDialogs: dialogs
    };
  `);

  console.error(`视频播放诊断：${reason}`, diagnostics);
}

/**
 * 关闭对话框
 * @param browser
 */
async function closeDialog(browser: WebDriver): Promise<void> {
  const messageBoxes: WebElement[] = await browser.findElements(By.className('el-message-box__wrapper'));
  for (let i: number = 0; i < messageBoxes.length; i++) {
    const messageBox: WebElement = messageBoxes[i]!;
    const display: string = await messageBox.getCssValue('display');
    if (display === 'none') {
      continue;
    }

    const ariaLabel: string = await messageBox.getAttribute('aria-label');
    const messageText: string = await messageBox.getText();
    if (ariaLabel === '温馨提示' || ariaLabel === '提示' || messageText.search('确认继续学习') >= 0) {
      await clickConfirmButton(browser, messageBox);
      continue;
    }

    console.error(`视频播放页出现未处理消息框：${ariaLabel || messageText}`);
    throw 'exit';
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
          await safeClick(browser, button);
          break;
        }
        default:
          console.error('视频播放页出现未处理对话框');
          throw 'exit';
      }
    }
  }

  await waitDialogHidden(browser);
}

async function clickConfirmButton(browser: WebDriver, container: WebElement): Promise<void> {
  const buttons: WebElement[] = await container.findElements(By.css('button'));
  const visibleButtons: WebElement[] = [];

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i]!;
    if (await button.isDisplayed()) {
      visibleButtons.push(button);
    }
  }

  for (let i = 0; i < visibleButtons.length; i++) {
    const button = visibleButtons[i]!;
    const buttonText: string = ((await button.getText()) || (await button.getAttribute('value')) || '').trim();
    if (/^(是|确定|确认|继续学习)$/.test(buttonText)) {
      await safeClick(browser, button);
      return;
    }
  }

  if (visibleButtons.length > 0) {
    await safeClick(browser, visibleButtons[visibleButtons.length - 1]!);
  }
}

async function safeClick(browser: WebDriver, element: WebElement): Promise<void> {
  try {
    await browser.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" });', element);
    await element.click();
  } catch (clickError) {
    if (isClickFallbackError(clickError)) {
      try {
        await browser.actions({ async: true }).move({ origin: element }).click().perform();
        return;
      } catch (actionClickError) {
        console.error('播放器 UI 点击失败', actionClickError);
        throw actionClickError;
      }
    }
    throw clickError;
  }
}

function isStaleElementError(errorValue: unknown): boolean {
  return (
    errorValue instanceof error.StaleElementReferenceError ||
    (errorValue instanceof Error && errorValue.name === 'StaleElementReferenceError')
  );
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
    // Some pages keep hidden dialog nodes around during animation; the next loop will retry visible UI clicks.
  }
}
