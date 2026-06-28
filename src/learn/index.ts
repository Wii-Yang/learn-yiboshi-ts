import type User from '../user/index.ts';
import { createBrowserByURL } from '../system/browser.ts';
import Config from '../system/config.ts';
import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
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
  // 进入用户中心
  const usercenter = '/usercenter/index';
  console.log('【打开用户中心页】');
  const browser: WebDriver = await createBrowserByURL(Config.YiboshiURL + usercenter, { headless: true }, user);

  try {
    console.log('课程列表加载中......');
    await browser.wait(until.elementLocated(By.className('nupt_main')));
    await browser.wait(async () => {
      const nupt_main: WebElement = await browser.findElement(By.className('nupt_main'));
      const a: WebElement[] = await nupt_main.findElements(By.css('a'));
      return a.length > 0;
    });
    await closeDialog(browser);

    // 获取课程列表
    const courseList: WebElement[] = await browser.findElements(By.css('.nupt_main a'));

    for (let i: number = 0; i < courseList.length; i++) {
      // 课程
      const course: WebElement = courseList[i]!;
      // 课程名称
      const courseTitle: string = await course.getText();
      // 切换到课程
      await browser.executeScript('arguments[0].scrollIntoView(false);', course);
      await course.click();

      console.log(`\n学习【${courseTitle}】课程\n`);

      const coursePageType = await getCoursePageType(browser);

      if (coursePageType === 'project') {
        // 项目列表课程
        await learnContinueCourse(browser, user);
      } else {
        // 其他课程
        await learnOtherCourse(browser, user);
      }

      console.log(`\n完成【${courseTitle}】课程\n`);
    }
  } catch (error) {
    await browser.quit();

    if (error === 'other course') {
      throw 'other course';
    }

    console.error('学习过程中出现错误', error);
    throw error;
  }
}

export default startLearn;
