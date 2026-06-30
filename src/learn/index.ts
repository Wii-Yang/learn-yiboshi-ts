import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { createBrowserByURL } from '../system/browser.ts';
import Config from '../system/config.ts';
import { learnContinueCourse, learnOtherCourse } from './course.ts';
import { closeDialog } from './utils.ts';

type CoursePageType = 'project' | 'other';

async function getCoursePageType(browser: WebDriver): Promise<CoursePageType> {
  const coursePageType = await browser.wait(async (): Promise<CoursePageType | false> => {
    const projectContainers: WebElement[] = await browser.findElements(By.css('.nupm_right.f_r'));
    if (projectContainers.length > 0) {
      return 'project';
    }

    const otherContainers: WebElement[] = await browser.findElements(By.css('.nupm_rightAll'));
    if (otherContainers.length > 0) {
      return 'other';
    }

    return false;
  }, 1000 * 15);

  if (!coursePageType) {
    throw new Error('无法识别课程页面类型');
  }

  return coursePageType;
}

async function startLearn(user: User) {
  const usercenter = '/usercenter/index';
  console.log('【打开用户中心页】');
  const browser: WebDriver = await createBrowserByURL(Config.YiboshiURL + usercenter, { headless: true }, user);

  try {
    console.log('课程列表加载中......');
    await browser.wait(until.elementLocated(By.className('nupt_main')));
    await browser.wait(async () => {
      const nuptMain: WebElement = await browser.findElement(By.className('nupt_main'));
      const links: WebElement[] = await nuptMain.findElements(By.css('a'));
      return links.length > 0;
    });
    await closeDialog(browser);

    const courseList: WebElement[] = await browser.findElements(By.css('.nupt_main a'));

    for (let i: number = 0; i < courseList.length; i++) {
      const course: WebElement = courseList[i]!;
      const courseTitle: string = await course.getText();

      try {
        await browser.executeScript('arguments[0].scrollIntoView(false);', course);
        await course.click();

        console.log(`\n学习【${courseTitle}】课程\n`);

        const coursePageType = await getCoursePageType(browser);

        if (coursePageType === 'project') {
          await learnContinueCourse(browser, user);
        } else {
          await learnOtherCourse(browser, user);
        }

        console.log(`\n完成【${courseTitle}】课程\n`);
      } catch (courseError) {
        logSkipCourseGroupError(courseTitle, courseError);
        await browser.get(Config.YiboshiURL + usercenter);
        await browser.wait(until.elementLocated(By.className('nupt_main')));
      }
    }
  } catch (error) {
    console.error('学习过程中出现错误', error);
    console.error('==================== 自动学习强提醒 ====================');
    console.error('学习流程出现未能自动恢复的错误，已阻止程序失败退出');
    console.error('请根据上方错误日志排查具体失败课程，后续可重新运行继续学习');
    console.error('========================================================');
  } finally {
    await browser.quit();
  }
}

function logSkipCourseGroupError(courseTitle: string, errorValue: unknown): void {
  console.error('==================== 自动学习强提醒 ====================');
  console.error(`课程分类【${courseTitle}】处理失败，已跳过并继续后续课程分类`);
  console.error('失败原因：', errorValue);
  console.error('========================================================');
}

export default startLearn;
