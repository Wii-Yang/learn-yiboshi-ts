import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { learnProject } from './project.ts';
import type User from '../user/index.ts';
import { examination } from './examination.ts';
import { playVideo } from './video.ts';
import { closeDialog } from './utils.ts';

/**
 * 等待项目列表加载
 * @param browser
 */
async function awaitProjectListLoading(browser: WebDriver): Promise<boolean> {
  return browser.wait(async (): Promise<boolean> => {
    const nupm_right: WebElement = await browser.findElement(By.className('nupm_right f_r'));

    const el_loading_mask: WebElement = await nupm_right.findElement(By.className('el-loading-mask'));
    const el_loading_mask__style: string = await el_loading_mask.getCssValue('display');
    return el_loading_mask__style === 'none';
  });
}

/**
 * 获取项目列表
 * @param nupm_right
 */
async function getProjectList(nupm_right: WebElement): Promise<WebElement[]> {
  // 点击搜索按钮
  const nupmr_main: WebElement = await nupm_right.findElement(By.className('nupmr_main'));
  const npm_case2: WebElement = await nupmr_main.findElement(By.className('npm_case2'));
  const input_list: WebElement[] = await npm_case2.findElements(By.css('input'));
  for (let i: number = 0; i < input_list.length; i++) {
    const input: WebElement = input_list[i]!;
    const input_type: string = await input.getAttribute('value');
    if (input_type === '搜索') {
      await nupm_right.getDriver().executeScript('arguments[0].scrollIntoView(false);', input);
      await input.click();
      break;
    }
  }

  await awaitProjectListLoading(nupmr_main.getDriver());

  const nupmrm_content: WebElement = await nupm_right.findElement(By.className('nupmrm_content'));
  return await nupmrm_content.findElements(By.className('npc_box'));
}

/**
 * 学习继续课程
 * @param browser
 * @param user
 */
export async function learnContinueCourse(browser: WebDriver, user: User): Promise<void> {
  try {
    await awaitProjectListLoading(browser);

    const nupm_right: WebElement = await browser.findElement(By.className('nupm_right f_r'));

    // 切换到“我的项目”
    const nupmr_title__list: WebElement[] = await nupm_right.findElements(By.css('.nupmr_title a'));
    for (let i: number = 0; i < nupmr_title__list.length; i++) {
      const nupmr_title: WebElement = nupmr_title__list[i]!;
      const nupmr_title__text: string = await nupmr_title.getText();
      if (nupmr_title__text === '我的项目') {
        await browser.executeScript('arguments[0].scrollIntoView(false);', nupmr_title);
        await nupmr_title.click();
        break;
      }
    }

    await awaitProjectListLoading(browser);

    let projectList: WebElement[] = [];
    do {
      const nupmrm_case: WebElement = await nupm_right.findElement(By.className('nupmrm_case'));
      const nupmrm_case__label_list: WebElement[] = await nupmrm_case.findElements(By.css('label'));

      for (let i: number = nupmrm_case__label_list.length - 1; i >= 0; i--) {
        const nupmrm_case__label: WebElement = nupmrm_case__label_list[i]!;
        const nupmrm_case__label_text: string = await nupmrm_case__label.getText();

        if (nupmrm_case__label_text === '学习中' || nupmrm_case__label_text === '未学习') {
          await browser.executeScript('arguments[0].scrollIntoView(false);', nupmrm_case__label);
          await nupmrm_case__label.click();
          projectList = await getProjectList(nupm_right);

          if (projectList.length > 0) {
            const project: WebElement = projectList[projectList.length - 1]!;

            // 学习项目
            await learnProject(project, user);
            break;
          }
        }
      }
    } while (projectList.length > 0);
  } catch {
    await learnContinueCourse(browser, user);
  }
}

/**
 * 等待其他课程列表加载
 * @param browser
 */
async function awaitOtherCourseLoading(browser: WebDriver): Promise<boolean> {
  await browser.wait(until.elementLocated(By.className('nup_main')));
  await browser.sleep(1000);
  return browser.wait(async (): Promise<boolean> => {
    const nup_main: WebElement = await browser.findElement(By.className('nup_main'));

    const el_loading_mask: WebElement = await nup_main.findElement(By.className('el-loading-mask'));
    const el_loading_mask__style: string = await el_loading_mask.getCssValue('display');
    if (el_loading_mask__style !== 'none') {
      return false;
    }

    const collapse_list: WebElement[] = await nup_main.findElements(
      By.css('.nupm_rightAll .nupmr_main .nupmrm_content .el-collapse .el-collapse-item'),
    );
    return collapse_list.length > 0;
  });
}

/**
 * 学习其他课程
 * @param browser
 * @param user
 */
export async function learnOtherCourse(browser: WebDriver, user: User): Promise<void> {
  try {
    let isEnd: boolean = false;
    do {
      // 等待课程列表加载
      await awaitOtherCourseLoading(browser);

      await browser.sleep(3000);
      await closeDialog(browser);

      const nup_main: WebElement = await browser.findElement(By.className('nup_main'));

      const npm_caseDiv1_right_list: WebElement[] = await nup_main.findElements(
        By.css('.nupm_rightAll .nupmr_main .nupmrm_case .npm_caseDiv1 .npm_caseDiv1_right label'),
      );

      for (let i: number = npm_caseDiv1_right_list.length - 1; i >= 0; i--) {
        const projectList: WebElement[] = [];
        const npm_caseDiv1_right: WebElement = npm_caseDiv1_right_list[i]!;
        const text: string = await npm_caseDiv1_right.getText();
        if (text === '学习中' || text === '未学习') {
          await browser.executeScript('arguments[0].scrollIntoView(false);', npm_caseDiv1_right);
          await npm_caseDiv1_right.click();

          const npm_caseDiv9_right_list: WebElement[] = await nup_main.findElements(
            By.css('.nupm_rightAll .nupmr_main .nupmrm_case .npm_caseDiv9 .npm_caseDiv9_right > input'),
          );
          for (let j: number = 0; j < npm_caseDiv1_right_list.length; j++) {
            const input: WebElement = npm_caseDiv9_right_list[j]!;
            const type: string = await input.getAttribute('type');
            if (type === 'button') {
              await browser.executeScript('arguments[0].scrollIntoView(false);', input);
              await input.click();
              break;
            }
          }

          await awaitOtherCourseLoading(browser);

          // 其他课程列表
          const collapse_list: WebElement[] = await nup_main.findElements(
            By.css('.nupm_rightAll .nupmr_main .nupmrm_content .el-collapse .el-collapse-item'),
          );

          for (let j: number = 0; j < collapse_list.length; j++) {
            const collapse_item: WebElement = collapse_list[j]!;
            const class_names: string = await collapse_item.getAttribute('class');
            if (class_names.search('is-active') < 0) {
              await browser.executeScript('arguments[0].scrollIntoView(false);', collapse_item);
              await collapse_item.click();
            }

            const course_list: WebElement[] = await collapse_item.findElements(
              By.css('.el-collapse-item__wrap .el-collapse-item__content table tbody tr'),
            );
            // 去掉表头
            course_list.splice(0, 1);
            projectList.push(...course_list);
          }

          if (projectList.length > 0) {
            for (let j: number = 0; j < projectList.length; j++) {
              const course: WebElement = projectList[j]!;
              const td: WebElement[] = await course.findElements(By.css('td'));
              // 获取课程名称
              const course_name: string = await td[1]!.findElement(By.className('course_name')).getText();
              // 获取课程状态
              const course_status: string = await td[td.length - 4]!.getText();

              if (course_status === '未学习' || course_status === '学习中') {
                console.log(`开始【${course_name}】课程学习`);

                // 考试
                await examination(td[td.length - 2]!, course_name, user);

                try {
                  // 播放视频
                  await playVideo(td[td.length - 3]!, course_name, user);

                  console.log(`完成【${course_name}】课程学习\n`);
                } finally {
                  // 刷新网页
                  await browser.navigate().refresh();
                }
                break;
              }
            }
          }
        }

        if (i == 0) {
          isEnd = true;
        }
      }
    } while (!isEnd);
  } catch {
    await learnOtherCourse(browser, user);
  }
}
