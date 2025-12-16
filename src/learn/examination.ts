import { By, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { getRedirectURLByButton } from './utils.ts';
import { createBrowserByURL } from '../system/browser.ts';

/**
 * 考试
 * @param button
 * @param courseName
 * @param user
 */
export async function examination(button: WebElement, courseName: string, user: User) {
  // 判断考试是否完成
  const k3: string = await button.findElement(By.className('k3')).getText();
  if (k3 === '考试[最高100分]') {
    return;
  }

  console.log('获取考试页网址中......');
  const url: string = await getRedirectURLByButton(button);

  console.log(`开始【${courseName}】课程考试`);
  await openExamination(url, user, courseName);
}

/**
 * 打开考试页
 * @param url
 * @param user
 * @param courseName
 */
async function openExamination(url: string, user: User, courseName: string): Promise<void> {
  // 打开考试页
  const browser: WebDriver = await createBrowserByURL(url, { headless: true }, user);

  try {
    console.log('考题加载中......');
    await browser.wait(async () => {
      const testTypeList: WebElement[] = await browser.findElements(By.className('test_type'));
      return testTypeList.length > 0;
    });

    const testTypeList: WebElement[] = await browser.findElements(By.className('test_type'));

    // 分类题目
    const choiceQuestions: WebElement[] = [];
    const multipleChoiceQuestions: WebElement[] = [];
    const judgingQuestions: WebElement[] = [];
    for (let i: number = 0; i < testTypeList.length; i++) {
      // 获取题目类型
      const ttTitle: WebElement = await testTypeList[i]!.findElement(By.className('tt_title'));
      const title: string = await ttTitle.getText();

      // 获取题目
      const questions: WebElement[] = await testTypeList[i]!.findElements(By.className('ttm_cell'));

      if (title.search('单项选择题') >= 0) {
        choiceQuestions.push(...questions);
      } else if (title.search('多项选择题') >= 0) {
        multipleChoiceQuestions.push(...questions);
      } else if (title.search('是非题') >= 0) {
        judgingQuestions.push(...questions);
      }
    }

    console.log('答题中......');
    await answerChoiceQuestions(choiceQuestions);
    await answerMultipleChoiceQuestions(multipleChoiceQuestions);
    await answerJudgingQuestions(judgingQuestions);
    console.log(`完成【${courseName}】课程答题`);
  } catch {
    console.error('\n考试过程中出现错误');
  } finally {
    await browser.close();
  }
}

/**
 * 查看结果
 * @param type
 * @param index
 * @param browser
 */
async function viewResults(type: string, index: number, browser: WebDriver): Promise<boolean> {
  // 获取交卷按钮
  const sjmSubmit: WebElement = await browser.findElement(By.className('sjm_submit'));
  const submit: WebElement = await sjmSubmit.findElement(By.css('a'));

  // 浏览器滚动到交卷按钮
  await browser.executeScript('arguments[0].scrollIntoView();', submit);
  await submit.click();

  // 等待弹窗出现
  await browser.wait(async () => {
    const dialogWrappers: WebElement[] = await browser.findElements(By.className('el-dialog__wrapper'));
    for (let i: number = 0; i < dialogWrappers.length; i++) {
      // 获取弹窗样式
      const style: string = await dialogWrappers[i]!.getAttribute('style');
      if (style.search('display: none') < 0) {
        const dialog: WebElement = await dialogWrappers[i]!.findElement(By.className('el-dialog'));
        const ariaLabel: string = await dialog.getAttribute('aria-label');
        if (ariaLabel === '答题成绩') {
          return true;
        }
      }
    }
    return false;
  });
  await browser.sleep(2000);

  // 获取答案列表
  const sbdmTitles: WebElement[] = await browser.findElements(By.className('sbdm_title'));
  const sbdmMains: WebElement[] = await browser.findElements(By.className('sbdm_main'));

  for (let i: number = 0; i < sbdmTitles.length; i++) {
    // 获取答案 title
    const title: string = await sbdmTitles[i]!.getText();

    if (title.search(type) >= 0) {
      // 答案结果列表
      const lis: WebElement[] = await sbdmMains[i]!.findElements(By.css('li'));

      const use: WebElement = await lis[index]!.findElement(By.css('use'));
      const xlink: string = await use.getAttribute('xlink:href');

      if (xlink === '#icon-selected') {
        await closeResultsDialog(browser);
        return false;
      }
    }
  }
  await closeResultsDialog(browser);
  return true;
}

/**
 * 关闭结果对话框
 * @param browser
 */
async function closeResultsDialog(browser: WebDriver): Promise<void> {
  const closeButton: WebElement = await browser.findElement(By.className('sbd_qding'));
  await closeButton.click();
}

/**
 * 选择题
 * @param questions
 */
async function answerChoiceQuestions(questions: WebElement[]): Promise<void> {
  const questionTotal: number = questions.length;
  if (questionTotal === 0) return;
  process.stdout.write(`\r单选题：0/${questionTotal}`);
  for (let i: number = 0; i < questionTotal; i++) {
    await answerChoiceQuestion(i, questions[i]!);

    let result = `\r单选题：${i + 1}/${questionTotal}`;
    if (i === questions.length - 1) {
      result += '\n';
    }
    process.stdout.write(result);
  }
}

/**
 * 回答选择题
 * @param index
 * @param question
 */
async function answerChoiceQuestion(index: number, question: WebElement): Promise<void> {
  const browser: WebDriver = question.getDriver();

  // 获取答案列表
  const ttmItems: WebElement = await question.findElement(By.className('ttm_items'));
  const items: WebElement[] = await ttmItems.findElements(By.className('stem'));

  let i: number = 0;

  do {
    // 浏览器滚动到答案
    await browser.executeScript('arguments[0].scrollIntoView(false);', question);

    // 获取本次选择的答案
    const stemItem: WebElement = await items[i]!.findElement(By.className('stemItem'));

    // 点击答案
    await stemItem.click();

    i++;
  } while (await viewResults('单选题', index, browser));
}

// 多选题答案列表
const MultipleChoiceResult: number[][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 3],
  [2, 4],
  [3, 4],
  [0, 1, 2],
  [0, 1, 3],
  [0, 1, 4],
  [0, 2, 3],
  [0, 2, 4],
  [0, 3, 4],
  [1, 2, 3],
  [1, 2, 4],
  [1, 3, 4],
  [2, 3, 4],
  [0, 1, 2, 3],
  [0, 1, 2, 4],
  [0, 1, 3, 4],
  [0, 2, 3, 4],
  [1, 2, 3, 4],
  [0, 1, 2, 3, 4],
];

/**
 * 多选题
 * @param questions
 */
async function answerMultipleChoiceQuestions(questions: WebElement[]): Promise<void> {
  const questionTotal: number = questions.length;
  if (questionTotal === 0) return;
  process.stdout.write(`\r多选题：0/${questionTotal}`);

  for (let i: number = 0; i < questions.length; i++) {
    await answerMultipleChoiceQuestion(i, questions[i]!);

    let result = `多选题：${i + 1}/${questionTotal}`;
    if (i === questions.length - 1) {
      result += '\n';
    }
    process.stdout.write(result);
  }
}

/**
 * 回答多选题
 * @param index
 * @param question
 * @constructor
 */
async function answerMultipleChoiceQuestion(index: number, question: WebElement) {
  const browser: WebDriver = question.getDriver();

  // 获取答案列表
  const ttmItems: WebElement = await question.findElement(By.className('ttm_items'));
  const items: WebElement[] = await ttmItems.findElements(By.className('stem'));

  let i: number = 0;

  do {
    // 浏览器滚动到答案
    await browser.executeScript('arguments[0].scrollIntoView(false);', question);

    if (i > 0) {
      // 取消已选中的答案
      await clickMultipleChoiceAnswers(i - 1, items);
    }

    await clickMultipleChoiceAnswers(i, items);

    i++;
  } while (await viewResults('多选题', index, browser));
}

/**
 * 点击多选题答案
 * @param index
 * @param items
 */
async function clickMultipleChoiceAnswers(index: number, items: WebElement[]): Promise<void> {
  // 获取需要点击的答案列表
  const result: number[] = MultipleChoiceResult[index]!;

  // 点击答案
  for (let i: number = 0; i < result.length; i++) {
    const stemItem: WebElement = await items[result[i]!]!.findElement(By.className('stemItem'));
    await stemItem.click();
  }
}

/**
 * 是非题
 * @param questions
 */
async function answerJudgingQuestions(questions: WebElement[]): Promise<void> {
  const questionTotal: number = questions.length;
  if (questionTotal === 0) return;
  process.stdout.write(`\r是非题：0/${questionTotal}`);

  for (let i: number = 0; i < questionTotal; i++) {
    await answerJudgingQuestion(i, questions[i]!);

    let result = `\r是非题：${i + 1}/${questionTotal}`;
    if (i === questions.length - 1) {
      result += '\n';
    }
    process.stdout.write(result);
  }
}

/**
 * 回答是非题
 * @param index
 * @param question
 */
async function answerJudgingQuestion(index: number, question: WebElement): Promise<void> {
  const browser: WebDriver = question.getDriver();

  // 获取答案列表
  const ttmItems: WebElement = await question.findElement(By.className('ttm_items'));
  const items: WebElement[] = await ttmItems.findElements(By.className('stem'));

  let i: number = 0;

  do {
    // 浏览器滚动到答案
    await browser.executeScript('arguments[0].scrollIntoView(false);', question);

    // 获取本次选择的答案
    const stemItem: WebElement = await items[i]!.findElement(By.className('stemItem'));

    // 点击答案
    await stemItem.click();

    i++;
  } while (await viewResults('是非题', index, browser));
}
