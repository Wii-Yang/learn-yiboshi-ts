import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { createBrowserByURL } from '../system/browser.ts';
import { examination } from './examination.ts';
import { DailyStudyLimitError, playVideo } from './video.ts';
import { closeDialog, getRedirectURLByButton } from './utils.ts';

const PROJECT_COURSE_LOAD_TIMEOUT_MS = 1000 * 45;

export async function learnProject(project: WebElement, user: User) {
  const npcb_txt: WebElement = await project.findElement(By.css('.npcb_txt a'));
  const url = await getRedirectURLByButton(npcb_txt);
  await openProject(url, user);
}

async function openProject(url: string, user: User): Promise<void> {
  const browser: WebDriver = await createBrowserByURL(url, { headless: true }, user);

  try {
    await awaitProjectLoading(browser);

    const nptitle: WebElement = await browser.findElement(By.css('.npd_info .npdi_txt .npdit1 .nptitle'));
    const title: string = await nptitle.getText();
    console.log(`开始【${title}】项目学习\n`);

    let isEnd: boolean = false;
    const skippedCourseNames = new Set<string>();
    do {
      await browser.sleep(3000);
      await closeDialog(browser);

      const rows: WebElement[] = await browser.findElements(By.css('.nupmrm_content table tbody tr'));

      for (let i: number = 1; i < rows.length; i++) {
        const td: WebElement[] = await rows[i]!.findElements(By.css('td'));
        const courseName: string = await td[1]!.getText();
        const courseStatus: string = await td[3]!.getText();
        const normalizedCourseName = normalizeText(courseName);

        if ((courseStatus === '学习中' || courseStatus === '未学习') && !skippedCourseNames.has(normalizedCourseName)) {
          console.log(`开始【${courseName}】课程学习`);

          try {
            await playVideo(td[4]!, courseName, user);

            await refreshProjectPage(browser);
            const latestCourseRow = await findCourseRowByName(browser, courseName);
            const latestTd: WebElement[] = await latestCourseRow.findElements(By.css('td'));

            await examination(latestTd[5]!, courseName, user);

            console.log(`完成【${courseName}】课程学习\n`);
          } catch (courseError) {
            if (courseError instanceof DailyStudyLimitError) {
              throw courseError;
            }
            skippedCourseNames.add(normalizedCourseName);
            logSkipCourseError(courseName, courseError);
          } finally {
            await refreshProjectPage(browser);
          }
          break;
        }

        if (i === rows.length - 1) {
          isEnd = true;
        }
      }
    } while (!isEnd);

    if (skippedCourseNames.size > 0) {
      throw new Error(
        `项目【${title}】仍有 ${skippedCourseNames.size} 门课程处理失败：${[...skippedCourseNames].join('、')}`,
      );
    }

    console.log(`完成【${title}】项目学习\n`);
  } finally {
    await browser.quit();
  }
}

async function awaitProjectLoading(browser: WebDriver): Promise<void> {
  await browser.wait(until.elementLocated(By.className('new_project_detail')));
  await browser.wait(until.elementLocated(By.className('nupmrm_content')));

  try {
    await browser.wait(async () => {
      const rows: WebElement[] = await browser.findElements(By.css('.nupmrm_content table tbody tr'));
      const courseRows: WebElement[] = [];

      for (let i = 0; i < rows.length; i++) {
        if ((await rows[i]!.findElements(By.css('td'))).length > 0) {
          courseRows.push(rows[i]!);
        }
      }

      if (courseRows.length <= 0) {
        return false;
      }

      const nptitle: WebElement = await browser.findElement(By.css('.npd_info .npdi_txt .npdit1 .nptitle'));
      const title: string = await nptitle.getText();
      return !!title;
    }, PROJECT_COURSE_LOAD_TIMEOUT_MS);
  } catch (loadError) {
    const pageState = await getProjectPageState(browser);
    throw new Error(
      `项目课程列表加载超时：页面只返回 ${pageState.courseRowCount} 条课程数据，平台课程接口可能查询失败；` +
        `当前页面：${pageState.url}`,
      { cause: loadError },
    );
  }
}

async function getProjectPageState(browser: WebDriver): Promise<{ url: string; courseRowCount: number }> {
  return await browser.executeScript(`
    const rows = [...document.querySelectorAll('.nupmrm_content table tbody tr')];
    return {
      url: location.href,
      courseRowCount: rows.filter((row) => row.querySelectorAll('td').length > 0).length
    };
  `);
}

async function refreshProjectPage(browser: WebDriver): Promise<void> {
  await browser.navigate().refresh();
  await awaitProjectLoading(browser);
  await closeDialog(browser);
}

async function findCourseRowByName(browser: WebDriver, courseName: string): Promise<WebElement> {
  return await browser.wait<WebElement>(async () => {
    const rows: WebElement[] = await browser.findElements(By.css('.nupmrm_content table tbody tr'));

    for (let i = 1; i < rows.length; i++) {
      const tds: WebElement[] = await rows[i]!.findElements(By.css('td'));
      if (tds.length <= 1) {
        continue;
      }

      const rowCourseName: string = normalizeText(await tds[1]!.getText());
      if (rowCourseName === normalizeText(courseName)) {
        return rows[i]!;
      }
    }

    return false;
  }, 1000 * 30);
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function logSkipCourseError(courseName: string, errorValue: unknown): void {
  console.error('==================== 自动学习强提醒 ====================');
  console.error(`课程【${courseName}】视频或考试处理失败，已跳过该课程并继续后续任务`);
  console.error('失败原因：', errorValue);
  console.error('========================================================');
}
