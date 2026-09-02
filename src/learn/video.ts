import { By, error, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { getRedirectURLByButton } from './utils.ts';
import { closeDialogs } from './dialog-manager.ts';
import { createBrowserByURL } from '../system/browser.ts';
import { logLive } from '../system/logger.ts';

let lastActiveVideoName = '';
let lastPlaybackLogTime = 0;
let lastVideoCurrentTime = 0;
let lastVideoCurrentTimeCheck = 0;
let lastPlaybackVideoKey = '';
let lastStallResumeTime = 0;
let lastProgressChangeTime = 0;
let lastProgressCompleted = 0;
let lastProgressRecoveryTime = 0;

// 达标进度采样点，用于估算剩余时间
const progressSamples: Array<{ time: number; value: number }> = [];

const VIDEO_PAGE_LOAD_TIMEOUT_MS = 1000 * 60 * 2;
// 视频时间未推进的检测阈值：玩家冻结后快速触发恢复，减少整夜空转
const STALL_DETECT_THRESHOLD_MS = 1000 * 60;
// 两次播放恢复之间的最小间隔，避免同一段视频被频繁刷新
const STALL_RESUME_COOLDOWN_MS = 1000 * 30;

interface PlaybackState {
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  videoKey: string;
}

export class DailyStudyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyStudyLimitError';
  }
}

/**
 * 播放视频
 * @param button
 * @param courseName
 * @param user
 */
export async function playVideo(button: WebElement, courseName: string, user: User): Promise<void> {
  console.log(`开始播放【${courseName}】课程视频`);

  console.log('获取视频网址中......');
  let url: string;
  try {
    url = await getVideoURLFromProjectPage(button, courseName);
    console.log('已从项目课程数据获取视频播放地址');
  } catch (projectDataError) {
    console.log('项目课程数据暂不可用，改用页面视频入口获取播放地址');
    try {
      url = await getRedirectURLByButton(button);
    } catch (redirectError) {
      const projectDataMessage =
        projectDataError instanceof Error ? projectDataError.message : String(projectDataError);
      const redirectMessage = redirectError instanceof Error ? redirectError.message : String(redirectError);
      throw new Error(`获取视频播放地址失败：项目数据：${projectDataMessage}；页面跳转：${redirectMessage}`);
    }
  }

  let lastPlayError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const browser: WebDriver = await createBrowserByURL(url, { headless: true, muteAudio: true }, user);

    try {
      console.log('等待视频加载中......');
      await waitVideoPageLoaded(browser);
      await muteVideo(browser);
      await waitInitialPlayback(browser);
      resetPlaybackState();
      progressSamples.length = 0;

      await browser.wait(async () => {
        try {
          await closeDialog(browser);
          await browser.sleep(1000);

          const pausedPlayers: WebElement[] = await browser.findElements(By.className('plyr--paused'));
          if (pausedPlayers.length === 1) {
            try {
              await playCurrentVideo(browser);
            } catch (resumeError) {
              console.error('播放器暂停且点击恢复失败，尝试原生播放恢复', resumeError);
              if (!(await forceResumeVideo(browser))) {
                await logVideoDiagnostics(browser, '播放器暂停且原生播放恢复失败');
                throw new Error('播放器暂停且恢复失败，停止本次播放以避免刷新后回退学习进度');
              }
              return false;
            }
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
      if (playError instanceof DailyStudyLimitError) {
        throw playError;
      }
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

async function getVideoURLFromProjectPage(button: WebElement, courseName: string): Promise<string> {
  const browser = button.getDriver();
  const result = await browser.executeScript<{ url: string } | null>(
    String.raw`
      const targetName = arguments[0].replace(/\s+/g, ' ').trim();
      const componentElement = [...document.querySelectorAll('*')].find((element) => {
        const vm = element.__vue__;
        return vm && Object.prototype.hasOwnProperty.call(vm.$data || {}, 'courseList');
      });
      const vm = componentElement && componentElement.__vue__;
      if (!vm || !vm.courseList) return null;

      const seen = new WeakSet();
      function findCourse(value, depth = 0) {
        if (!value || typeof value !== 'object' || depth > 8 || seen.has(value)) return null;
        seen.add(value);

        const name = String(value.name || value.courseName || '').replace(/\s+/g, ' ').trim();
        if (name === targetName && value.id != null) return value;

        for (const child of Object.values(value)) {
          const found = findCourse(child, depth + 1);
          if (found) return found;
        }
        return null;
      }

      const course = findCourse(vm.courseList);
      if (!course || !vm.userInfo || vm.userInfo.id == null) return null;

      const currentQuery = new URLSearchParams(location.search);
      const query = new URLSearchParams({
        uId: String(vm.userInfo.id),
        tId: String(vm.trainingId || currentQuery.get('trainingId') || ''),
        pId: String(vm.projectId || currentQuery.get('projectId') || ''),
        cId: String(course.id),
        showAds: currentQuery.get('showAds') || '0',
        enableStudyOnTheSameTime: currentQuery.get('enableStudyOnTheSameTime') || '0',
        isJiJiao: '1',
        switchMyProject: currentQuery.get('switchMyProject') || 'true',
        isPractiseScore: course.practiseScore == null ? 'yes' : 'no',
        practiseSize: currentQuery.get('practiseSize') || '',
        uuid: String(vm.faceRecognitionUuid || ''),
        enableProgressShow: String((vm.currentTraining && vm.currentTraining.enableProgressShow) || 1)
      });

      return { url: new URL('/videoPlayer?' + query.toString(), location.origin).href };
    `,
    courseName,
  );

  if (!result?.url) {
    throw new Error(`未在项目课程数据中找到【${courseName}】的视频播放信息`);
  }

  return result.url;
}

/**
 * 切换清晰度
 * @param browser
 */
export async function changeVideoClarity(browser: WebDriver): Promise<void> {
  const vmQingxi: WebElement = await browser.findElement(By.className('vm_qingxi'));
  const elSwitch: WebElement = await vmQingxi.findElement(By.className('el-switch'));
  const switchClassName: string = await elSwitch.getAttribute('class');
  if (switchClassName.search('is-checked') >= 0) {
    await elSwitch.click();
  }
}

async function waitVideoPageLoaded(browser: WebDriver): Promise<void> {
  await browser.wait(until.elementLocated(By.css('.video_main')), VIDEO_PAGE_LOAD_TIMEOUT_MS);
  await browser.wait(async () => {
    const videoMain: WebElement = await browser.findElement(By.css('.video_main'));
    const loadingMasks: WebElement[] = await videoMain.findElements(By.css('.el-loading-mask'));
    if (loadingMasks.length > 0 && (await loadingMasks[0]!.getCssValue('display')) !== 'none') {
      return false;
    }

    const videoList: WebElement[] = await videoMain.findElements(By.css('.vm .vm_list .vml_main ul li'));
    const players: WebElement[] = await videoMain.findElements(By.css('.vm_video .plyr'));
    return videoList.length > 0 && players.length > 0;
  }, VIDEO_PAGE_LOAD_TIMEOUT_MS);
}

function resetPlaybackState(): void {
  lastActiveVideoName = '';
  lastPlaybackLogTime = 0;
  lastVideoCurrentTime = 0;
  lastVideoCurrentTimeCheck = Date.now();
  lastPlaybackVideoKey = '';
  lastStallResumeTime = 0;
  lastProgressChangeTime = Date.now();
  lastProgressCompleted = 0;
  lastProgressRecoveryTime = 0;
}

async function isCompleted(browser: WebDriver): Promise<boolean> {
  const videoDabiao: WebElement = await browser.findElement(By.css('.video_main .vm .vm_star .video_dabiao'));
  const videoDabiaoText: string = await videoDabiao.getText();
  const value: string[] | null = videoDabiaoText.match(/[0-9]{1,3}/g) as string[] | null;
  if (value && value.length === 2) {
    const progressList: number[] = value.map((item: string) => Number(item));
    const completedProgress = progressList[1]!;
    if (completedProgress !== lastProgressCompleted) {
      lastProgressCompleted = completedProgress;
      lastProgressChangeTime = Date.now();
      progressSamples.push({ time: lastProgressChangeTime, value: completedProgress });
      if (progressSamples.length > 12) {
        progressSamples.shift();
      }
    }

    if (progressList[0]! <= progressList[1]!) {
      if (await playNextVideoIfExists(browser)) {
        return false;
      }
      await browser.sleep(2000);
      return true;
    }
  }
  return false;
}

async function logActiveVideo(browser: WebDriver): Promise<void> {
  try {
    const activeVideo = await getActiveVideo(browser);
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

async function logPlaybackHeartbeat(browser: WebDriver): Promise<void> {
  const playbackState = await getPlaybackState(browser);
  if (!playbackState) {
    return;
  }

  const now = Date.now();
  if (playbackState.videoKey !== lastPlaybackVideoKey) {
    // A new video starts from a lower currentTime than the previous one.
    // Reset the stall baseline before comparing playback positions.
    lastPlaybackVideoKey = playbackState.videoKey;
    lastVideoCurrentTime = playbackState.currentTime;
    lastVideoCurrentTimeCheck = now;
    lastStallResumeTime = 0;
  }
  const isAdvancing = playbackState.currentTime > lastVideoCurrentTime + 1;
  if (isAdvancing) {
    lastVideoCurrentTime = playbackState.currentTime;
    lastVideoCurrentTimeCheck = now;
  }

  if (isVideoEnded(playbackState) && (await playNextVideoIfExists(browser))) {
    return;
  }

  if (!playbackState.ended && !isAdvancing && now - lastVideoCurrentTimeCheck > STALL_DETECT_THRESHOLD_MS) {
    if (now - lastStallResumeTime > STALL_RESUME_COOLDOWN_MS) {
      await recoverVideo(
        browser,
        `视频时间未推进：${formatSeconds(playbackState.currentTime)}/${formatSeconds(playbackState.duration)}`,
      );
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

  const currentProgress = await getCompletedProgress(browser);
  const progressBar = currentProgress !== null ? buildProgressBar(currentProgress) : '';
  let etaSeconds: number | null = currentProgress !== null ? estimateRemainingSeconds(currentProgress) : null;
  if (etaSeconds === null && playbackState.duration > playbackState.currentTime) {
    etaSeconds = playbackState.duration - playbackState.currentTime;
  }
  const etaText = etaSeconds !== null ? formatEta(etaSeconds) : '估算中...';
  const progressInfo = currentProgress !== null ? `${progressBar} ${currentProgress}/100` : '达标进度未知';
  logLive(
    `视频播放中：${formatSeconds(playbackState.currentTime)}/${formatSeconds(playbackState.duration)}  |  学习进度 ${progressInfo}  |  预计剩余 ${etaText}`,
  );
  lastPlaybackLogTime = now;
}

async function playNextVideoIfExists(browser: WebDriver): Promise<boolean> {
  const videoItems: WebElement[] = await browser.findElements(By.css('.vm .vm_list .vml_main ul li'));
  const activeIndex = await getActiveVideoIndex(videoItems);

  if (activeIndex < 0 || activeIndex >= videoItems.length - 1) {
    return false;
  }

  const nextVideo = videoItems[activeIndex + 1]!;
  const nextVideoName = formatActiveVideoName(await nextVideo.getText());
  logLive(`切换到下一个视频：${nextVideoName}`);

  const clickTargets: WebElement[] = await nextVideo.findElements(By.css('a,button,input'));
  await safeClick(browser, clickTargets[0] || nextVideo);

  resetPlaybackState();
  await browser.wait(async () => {
    await closeDialog(browser);
    const latestItems: WebElement[] = await browser.findElements(By.css('.vm .vm_list .vml_main ul li'));
    return (await getActiveVideoIndex(latestItems)) === activeIndex + 1;
  }, 1000 * 15);
  await waitInitialPlayback(browser);
  return true;
}

async function getActiveVideo(browser: WebDriver): Promise<WebElement | undefined> {
  const videoItems: WebElement[] = await browser.findElements(By.css('.vm .vm_list .vml_main ul li'));
  const activeIndex = await getActiveVideoIndex(videoItems);
  if (activeIndex < 0) {
    return undefined;
  }

  return videoItems[activeIndex];
}

async function getActiveVideoIndex(videoItems: WebElement[]): Promise<number> {
  for (let i = 0; i < videoItems.length; i++) {
    const className: string = await videoItems[i]!.getAttribute('class');
    if (/(^|\s)(active|on|current|selected|is-active|vmlm_ing)(\s|$)/.test(className)) {
      return i;
    }
  }

  return -1;
}

function formatActiveVideoName(videoText: string): string {
  return videoText
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*/, '');
}

function isVideoEnded(playbackState: PlaybackState): boolean {
  return playbackState.ended;
}

async function getPlaybackState(browser: WebDriver): Promise<PlaybackState | undefined> {
  return await browser.executeScript(`
    const video = document.querySelector('video');
    if (!video) return undefined;
    return {
      currentTime: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      paused: video.paused,
      ended: video.ended,
      videoKey: video.currentSrc || video.src || String(video.duration)
    };
  `);
}

async function getCompletedProgress(browser: WebDriver): Promise<number | null> {
  try {
    const progressElement = await browser.findElement(By.css('.video_main .vm .vm_star .video_dabiao'));
    const progressText = await progressElement.getText();
    const value = progressText.match(/[0-9]{1,3}/g) as string[] | null;
    if (value && value.length === 2) {
      return Number(value[1]);
    }
  } catch {
    return null;
  }
  return null;
}

function buildProgressBar(progress: number, width = 12): string {
  const clamped = Math.max(0, Math.min(100, progress));
  const filled = Math.round((clamped / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function estimateRemainingSeconds(currentProgress: number): number | null {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const recent = progressSamples.filter((sample) => now - sample.time <= windowMs);
  if (recent.length < 2) {
    return null;
  }
  const first = recent[0]!;
  const last = recent[recent.length - 1]!;
  const dtSeconds = (last.time - first.time) / 1000;
  const dv = last.value - first.value;
  if (dtSeconds <= 0 || dv <= 0) {
    return null;
  }
  const ratePerSecond = dv / dtSeconds;
  const remaining = 100 - currentProgress;
  return remaining > 0 ? remaining / ratePerSecond : 0;
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '估算中...';
  }
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分`;
  }
  if (minutes > 0) {
    return `${minutes} 分 ${secs} 秒`;
  }
  return `${secs} 秒`;
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

async function forceResumeVideo(browser: WebDriver): Promise<boolean> {
  // 平台会把修改 currentTime 视为拖拽并丢弃后续进度。恢复时只调用 play()，
  // 并以播放时间自然推进作为成功条件。
  for (let attempt = 0; attempt < 2; attempt++) {
    await closeDialog(browser);
    const before = await getPlaybackState(browser);
    if (!before) {
      return false;
    }

    const playError = await browser.executeAsyncScript<string | null>(`
      const done = arguments[arguments.length - 1];
      const video = document.querySelector('video');
      if (!video) {
        done('video element not found');
        return;
      }
      video.muted = true;
      video.volume = 0;
      Promise.resolve(video.play()).then(() => done(null)).catch((error) => done(String(error)));
    `);

    if (playError) {
      console.error(`原生 video.play() 失败：${playError}`);
    }

    try {
      await browser.wait(async () => {
        const playbackState = await getPlaybackState(browser);
        return !!playbackState && !playbackState.paused && playbackState.currentTime > before.currentTime + 1;
      }, 1000 * 8);
      return true;
    } catch {
      // 平台提示框可能在 play() 后异步出现；下一轮先关闭提示框再重试。
    }
  }

  return false;
}

async function recoverVideo(browser: WebDriver, reason: string, refreshFirst = false): Promise<void> {
  logLive(`播放恢复：${reason}`);

  if (!refreshFirst) {
    try {
      if (await forceResumeVideo(browser)) {
        logLive('播放恢复成功：原生 video.play() 已恢复时间推进');
        return;
      }
    } catch (uiError) {
      console.error('通过播放器 UI 恢复失败，刷新播放页后重试', uiError);
    }
  }

  await logVideoDiagnostics(browser, reason);
  logLive('播放恢复：刷新播放页并重新点击播放器 UI');
  await browser.navigate().refresh();
  await waitVideoPageLoaded(browser);
  await closeDialog(browser);
  await muteVideo(browser);
  await playCurrentVideo(browser);
  resetPlaybackState();
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

async function closeDialog(browser: WebDriver): Promise<void> {
  await closeDialogs(browser, {
    onVisibleMessageBox: (_label, text) => {
      if (isDailyStudyLimitMessage(text)) throw new DailyStudyLimitError(normalizeDialogMessage(text));
      return false;
    },
    onVisibleDialog: (_label, text) => {
      if (isDailyStudyLimitMessage(text)) throw new DailyStudyLimitError(normalizeDialogMessage(text));
      return false;
    },
  });
}

function isDailyStudyLimitMessage(message: string): boolean {
  return message.includes('当日您已累计学习') && message.includes('小时') && message.includes('建议立即休息');
}

function normalizeDialogMessage(message: string): string {
  return message
    .replace(/\s+/g, ' ')
    .replace(/^温馨提示\s*/, '')
    .replace(/\s*知道了$/, '')
    .trim();
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
