import { By, error, type WebDriver, type WebElement } from 'selenium-webdriver';
import type User from '../user/index.ts';
import { getRedirectURLByButton } from './utils.ts';
import { createBrowserByURL } from '../system/browser.ts';

const TEST_LOAD_TIMEOUT = 30 * 1000;
const RESULT_DIALOG_TIMEOUT = 20 * 1000;
const CLICK_SETTLE_TIME = 500;

type QuestionType = '单选题' | '多选题' | '是非题';

interface QuestionGroups {
  choice: WebElement[];
  multipleChoice: WebElement[];
  judging: WebElement[];
}

/**
 * 考试
 * @param button
 * @param courseName
 * @param user
 */
export async function examination(button: WebElement, courseName: string, user: User) {
  // 判断考试是否完成
  const k3: string = await button.findElement(By.className('k3')).getText();
  if (k3.includes('最高100分')) {
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
  const browser: WebDriver = await createBrowserByURL(url, { headless: true }, user);

  try {
    console.log('考题加载中......');
    await browser.wait(async () => {
      const testTypeList: WebElement[] = await browser.findElements(By.className('test_type'));
      return testTypeList.length > 0;
    }, TEST_LOAD_TIMEOUT);

    const questionGroups = await getQuestionGroups(browser);
    console.log(
      `答题中...... 单选题：${questionGroups.choice.length}，多选题：${questionGroups.multipleChoice.length}，是非题：${questionGroups.judging.length}`,
    );

    await answerChoiceQuestions(questionGroups.choice);
    await answerMultipleChoiceQuestions(questionGroups.multipleChoice);
    await answerJudgingQuestions(questionGroups.judging);

    console.log(`完成【${courseName}】课程答题`);
  } catch (examError) {
    console.error('\n考试过程中出现错误', examError);
    await logExamDiagnostics(browser, '考试异常诊断');
    throw examError;
  } finally {
    await browser.quit();
  }
}

async function getQuestionGroups(browser: WebDriver): Promise<QuestionGroups> {
  const testTypeList: WebElement[] = await browser.findElements(By.className('test_type'));
  const questionGroups: QuestionGroups = {
    choice: [],
    multipleChoice: [],
    judging: [],
  };

  for (let i = 0; i < testTypeList.length; i++) {
    const ttTitle: WebElement = await testTypeList[i]!.findElement(By.className('tt_title'));
    const title: string = await ttTitle.getText();
    const questions: WebElement[] = await testTypeList[i]!.findElements(By.className('ttm_cell'));

    if (title.includes('单项选择题') || title.includes('单选题')) {
      questionGroups.choice.push(...questions);
    } else if (title.includes('多项选择题') || title.includes('多选题')) {
      questionGroups.multipleChoice.push(...questions);
    } else if (title.includes('是非题') || title.includes('判断题')) {
      questionGroups.judging.push(...questions);
    } else {
      console.error(`考试题型未识别：${title}，题目数：${questions.length}`);
    }
  }

  return questionGroups;
}

/**
 * 查看结果
 * @param type
 * @param index
 * @param browser
 */
async function viewResults(type: QuestionType, index: number, browser: WebDriver): Promise<boolean> {
  const submit = await findSubmitButton(browser);
  await clickElement(browser, submit);

  const resultDialog = await waitResultDialog(browser);
  await browser.sleep(1000);

  const sbdmTitles: WebElement[] = await resultDialog.findElements(By.className('sbdm_title'));
  const sbdmMains: WebElement[] = await resultDialog.findElements(By.className('sbdm_main'));

  for (let i = 0; i < sbdmTitles.length; i++) {
    const title: string = await sbdmTitles[i]!.getText();
    if (!title.includes(type)) continue;

    const lis: WebElement[] = await sbdmMains[i]!.findElements(By.css('li'));
    if (!lis[index]) {
      await closeResultsDialog(browser);
      throw new Error(`${type}第 ${index + 1} 题在成绩弹窗中不存在，弹窗题数：${lis.length}`);
    }

    const use: WebElement = await lis[index]!.findElement(By.css('use'));
    const xlink: string = await use.getAttribute('xlink:href');
    await closeResultsDialog(browser);
    return xlink !== '#icon-selected';
  }

  await closeResultsDialog(browser);
  throw new Error(`成绩弹窗中未找到题型：${type}`);
}

async function findSubmitButton(browser: WebDriver): Promise<WebElement> {
  const sjmSubmit: WebElement = await browser.findElement(By.className('sjm_submit'));
  return sjmSubmit.findElement(By.css('a'));
}

async function waitResultDialog(browser: WebDriver): Promise<WebElement> {
  try {
    const resultDialog = await browser.wait(async () => {
      const dialogWrappers: WebElement[] = await browser.findElements(By.className('el-dialog__wrapper'));
      for (let i = 0; i < dialogWrappers.length; i++) {
        if (!(await isVisible(dialogWrappers[i]!))) continue;

        const dialog: WebElement = await dialogWrappers[i]!.findElement(By.className('el-dialog'));
        const ariaLabel: string = await dialog.getAttribute('aria-label');
        const text: string = await dialog.getText();
        if (ariaLabel.includes('答题成绩') || text.includes('答题成绩')) {
          return dialogWrappers[i]!;
        }
      }
      return false;
    }, RESULT_DIALOG_TIMEOUT);
    return resultDialog as WebElement;
  } catch (waitError) {
    if (waitError instanceof error.TimeoutError) {
      await logExamDiagnostics(browser, '等待答题成绩弹窗超时');
    }
    throw waitError;
  }
}

/**
 * 关闭结果对话框
 * @param browser
 */
async function closeResultsDialog(browser: WebDriver): Promise<void> {
  const closeButtons: WebElement[] = await browser.findElements(By.className('sbd_qding'));
  for (let i = 0; i < closeButtons.length; i++) {
    if (!(await isVisible(closeButtons[i]!))) continue;
    await clickElement(browser, closeButtons[i]!);
    await browser.sleep(CLICK_SETTLE_TIME);
    return;
  }

  const confirmButtons: WebElement[] = await browser.findElements(By.css('.el-dialog__footer button,.el-message-box__btns button'));
  for (let i = confirmButtons.length - 1; i >= 0; i--) {
    if (!(await isVisible(confirmButtons[i]!))) continue;
    await clickElement(browser, confirmButtons[i]!);
    await browser.sleep(CLICK_SETTLE_TIME);
    return;
  }
}

/**
 * 选择题
 * @param questions
 */
async function answerChoiceQuestions(questions: WebElement[]): Promise<void> {
  const questionTotal: number = questions.length;
  if (questionTotal === 0) return;

  for (let i = 0; i < questionTotal; i++) {
    await answerSingleAnswerQuestion('单选题', i, questions[i]!);
    console.log(`单选题：${i + 1}/${questionTotal}`);
  }
}

async function answerSingleAnswerQuestion(type: '单选题' | '是非题', index: number, question: WebElement): Promise<void> {
  const browser: WebDriver = question.getDriver();
  const items = await getAnswerItems(question);

  if (items.length === 0) {
    throw new Error(`${type}第 ${index + 1} 题没有可选答案`);
  }

  for (let i = 0; i < items.length; i++) {
    await scrollToQuestion(browser, question);
    await clickElement(browser, await items[i]!.findElement(By.className('stemItem')));

    const shouldRetry = await viewResults(type, index, browser);
    if (!shouldRetry) return;
  }

  throw new Error(`${type}第 ${index + 1} 题已尝试 ${items.length} 个选项，仍未答对`);
}

/**
 * 多选题
 * @param questions
 */
async function answerMultipleChoiceQuestions(questions: WebElement[]): Promise<void> {
  const questionTotal: number = questions.length;
  if (questionTotal === 0) return;

  for (let i = 0; i < questionTotal; i++) {
    await answerMultipleChoiceQuestion(i, questions[i]!);
    console.log(`多选题：${i + 1}/${questionTotal}`);
  }
}

/**
 * 回答多选题
 * @param index
 * @param question
 */
async function answerMultipleChoiceQuestion(index: number, question: WebElement): Promise<void> {
  const browser: WebDriver = question.getDriver();
  const items = await getAnswerItems(question);
  const combinations = createAnswerCombinations(items.length);

  if (combinations.length === 0) {
    throw new Error(`多选题第 ${index + 1} 题没有可选答案`);
  }

  let previousCombination: number[] = [];
  for (let i = 0; i < combinations.length; i++) {
    await scrollToQuestion(browser, question);
    await clickAnswers(previousCombination, items);
    await clickAnswers(combinations[i]!, items);
    previousCombination = combinations[i]!;

    const shouldRetry = await viewResults('多选题', index, browser);
    if (!shouldRetry) return;
  }

  throw new Error(`多选题第 ${index + 1} 题已尝试 ${combinations.length} 种组合，仍未答对`);
}

function createAnswerCombinations(itemCount: number): number[][] {
  const combinations: number[][] = [];
  const maxMask = 1 << itemCount;

  for (let mask = 1; mask < maxMask; mask++) {
    const combination: number[] = [];
    for (let i = 0; i < itemCount; i++) {
      if ((mask & (1 << i)) !== 0) {
        combination.push(i);
      }
    }
    combinations.push(combination);
  }

  return combinations.sort((left, right) => left.length - right.length);
}

/**
 * 点击多选题答案
 * @param answerIndexes
 * @param items
 */
async function clickAnswers(answerIndexes: number[], items: WebElement[]): Promise<void> {
  for (let i = 0; i < answerIndexes.length; i++) {
    const stemItem: WebElement = await items[answerIndexes[i]!]!.findElement(By.className('stemItem'));
    await clickElement(stemItem.getDriver(), stemItem);
  }
}

/**
 * 是非题
 * @param questions
 */
async function answerJudgingQuestions(questions: WebElement[]): Promise<void> {
  const questionTotal: number = questions.length;
  if (questionTotal === 0) return;

  for (let i = 0; i < questionTotal; i++) {
    await answerSingleAnswerQuestion('是非题', i, questions[i]!);
    console.log(`是非题：${i + 1}/${questionTotal}`);
  }
}

async function getAnswerItems(question: WebElement): Promise<WebElement[]> {
  const ttmItems: WebElement = await question.findElement(By.className('ttm_items'));
  return ttmItems.findElements(By.className('stem'));
}

async function scrollToQuestion(browser: WebDriver, question: WebElement): Promise<void> {
  await browser.executeScript('arguments[0].scrollIntoView({ block: "center" });', question);
  await browser.sleep(CLICK_SETTLE_TIME);
}

async function clickElement(browser: WebDriver, element: WebElement): Promise<void> {
  await browser.executeScript('arguments[0].scrollIntoView({ block: "center" });', element);
  await browser.sleep(200);
  await element.click();
}

async function isVisible(element: WebElement): Promise<boolean> {
  try {
    return await element.isDisplayed();
  } catch {
    return false;
  }
}

async function logExamDiagnostics(browser: WebDriver, reason: string): Promise<void> {
  try {
    const diagnostics = await browser.executeScript(`
      const visibleText = (node) => (node && node.innerText ? node.innerText.trim().slice(0, 500) : '');
      const dialogs = [...document.querySelectorAll('.el-dialog__wrapper,.el-message-box__wrapper')]
        .map((dialog) => ({
          display: getComputedStyle(dialog).display,
          className: dialog.className,
          text: visibleText(dialog)
        }))
        .filter((dialog) => dialog.display !== 'none');
      const testTypes = [...document.querySelectorAll('.test_type')].map((type) => ({
        title: visibleText(type.querySelector('.tt_title')),
        questionCount: type.querySelectorAll('.ttm_cell').length
      }));
      return {
        title: document.title,
        url: location.href,
        dialogs,
        testTypes,
        submitText: visibleText(document.querySelector('.sjm_submit')),
        bodyText: visibleText(document.body)
      };
    `);
    console.error(`${reason}`, diagnostics);
  } catch (diagnosticError) {
    console.error(`${reason}失败`, diagnosticError);
  }
}
