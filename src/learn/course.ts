import { By, type WebDriver, type WebElement } from 'selenium-webdriver';
import { learnProject } from './project.ts';
import type User from '../user/index.ts';

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
 * 学习其他课程
 * @param browser
 * @param user
 */
export async function learnOtherCourse(browser: WebDriver, user: User): Promise<void> {
  console.log(browser, user);
  throw 'other course';
}
