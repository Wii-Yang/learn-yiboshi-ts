import type User from '../user/index.ts';
import { createBrowserByURL } from '../system/browser.ts';
import Config from '../system/config.ts';
import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { learnContinueCourse, learnOtherCourse } from './course.ts';
import { closeDialog } from './utils.ts';

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

      if (courseTitle.search('继续医学教育（远程）项目') >= 0) {
        // 继续课程
        await learnContinueCourse(browser, user);
      } else {
        // 其他课程
        await learnOtherCourse(browser, user);
      }

      console.log(`\n完成【${courseTitle}】课程\n`);
    }
  } catch (error) {
    await browser.close();

    if (error === 'other course') {
      throw 'other course';
    }
  }
}

export default startLearn;
