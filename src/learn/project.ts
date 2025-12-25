import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { createBrowserByURL } from '../system/browser.ts';
import { examination } from './examination.ts';
import { playVideo } from './video.ts';
import { closeDialog } from './utils.ts';

// 学习项目
export async function learnProject(project: WebElement, user: User) {
  // 获取项目链接
  const npcb_txt: WebElement = await project.findElement(By.css('.npcb_txt a'));
  const url: string = await npcb_txt.getAttribute('href');

  await openProject(url, user);
}

// 打开项目
async function openProject(url: string, user: User): Promise<void> {
  // 打开项目页
  const browser: WebDriver = await createBrowserByURL(url, { headless: true }, user);

  try {
    // 等待项目加载
    await awaitProjectLoading(browser);

    // 获取项目信息
    const nptitle: WebElement = await browser.findElement(By.css('.npd_info .npdi_txt .npdit1 .nptitle'));

    // 项目名称
    const title: string = await nptitle.getText();
    console.log(`开始【${title}】项目学习\n`);

    let isEnd: boolean = false;
    do {
      await browser.sleep(3000);

      await closeDialog(browser);

      const tr: WebElement[] = await browser.findElements(By.css('.nupmrm_content table tbody tr'));

      for (let i: number = 1; i < tr.length; i++) {
        const td: WebElement[] = await tr[i]!.findElements(By.css('td'));
        // 课程名称
        const courseName: string = await td[1]!.getText();

        // 获取课程状态
        const courseStatus: string = await td[3]!.getText();

        if (courseStatus === '学习中' || courseStatus === '未学习') {
          console.log(`开始【${courseName}】课程学习`);

          // 考试
          await examination(td[5]!, courseName, user);

          try {
            // 播放视频
            await playVideo(td[4]!, courseName, user);

            console.log(`完成【${courseName}】课程学习\n`);
          } finally {
            // 刷新网页
            await browser.navigate().refresh();
          }
          break;
        }

        if (i === tr.length - 1) {
          isEnd = true;
        }
      }
    } while (!isEnd);
    console.log(`完成【${title}】项目学习\n`);
  } finally {
    await browser.quit();
  }
}

/**
 * 等待项目加载
 * @param browser
 */
async function awaitProjectLoading(browser: WebDriver): Promise<void> {
  await browser.wait(until.elementLocated(By.className('new_project_detail')));

  await browser.wait(until.elementLocated(By.className('nupmrm_content')));

  await browser.wait(async () => {
    const tr: WebElement[] = await browser.findElements(By.css('.nupmrm_content table tbody tr'));

    if (tr.length <= 0) {
      return false;
    }

    const nptitle: WebElement = await browser.findElement(By.css('.npd_info .npdi_txt .npdit1 .nptitle'));
    const title: string = await nptitle.getText();

    return !!title;
  });
}
