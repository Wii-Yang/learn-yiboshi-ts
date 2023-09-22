import { WebDriver, WebElement, By } from 'selenium-webdriver'
import User from '../user'
import { createBrowserByUrl } from '../browser'

export async function examination(examinationButton: WebElement, user: User): Promise<void> {
  const browser: WebDriver = examinationButton.driver_
  // 浏览器滚动到考试
  await browser.executeScript('arguments[0].scrollIntoView(false);', examinationButton)

  await examinationButton.click()
  // 浏览器切换到考试页
  const courseWindowHandle: string = await browser.getWindowHandle()
  const allWindowHandles: string[] = await browser.getAllWindowHandles()
  const examinationWindowHandle: string | undefined = allWindowHandles.find(
    (item: string): boolean => item !== courseWindowHandle
  )
  await browser.switchTo().window(examinationWindowHandle)

  // 获取考试页 url
  const examinationUrl = await browser.getCurrentUrl()

  // 浏览器关闭视频页
  await browser.close()
  // 浏览器切换到课程页
  await browser.switchTo().window(courseWindowHandle)

  await openExamination(examinationUrl, user)
}

/**
 * 打开考试页
 * @param url
 * @param user
 */
async function openExamination(url: string, user: User): Promise<void> {
  // 打开考试页
  const browser: WebDriver = await createBrowserByUrl(url, user)

  // 等待考题加载完成
  await browser.wait(async _ => {
    const testTypeList: WebElement[] = await browser.findElements(By.className('test_type'))
    return testTypeList.length > 0
  })

  // 获取考题列表
  const testTypeList: WebElement[] = await browser.findElements(By.className('test_type'))

  // 分类题目
  const choiceQuestions: WebElement[] = []
  const multipleChoiceQuestions: WebElement[] = []
  const judgingQuestions: WebElement[] = []
  for (let i: number = 0; i < testTypeList.length; i++) {
    // 获取题目类型
    const ttTitle: WebElement = await testTypeList[i].findElement(By.className('tt_title'))
    const title: string = await ttTitle.getText()

    // 获取题目
    const questions: WebElement[] = await testTypeList[i].findElements(By.className('ttm_cell'))

    if (title.search('单项选择题') >= 0) {
      choiceQuestions.splice(0, 0, ...questions)
    } else if (title.search('多项选择题') >= 0) {
      multipleChoiceQuestions.splice(0, 0, ...questions)
    } else if (title.search('是非题') >= 0) {
      judgingQuestions.splice(0, 0, ...questions)
    }
  }

  try {
    await answerChoiceQuestions(choiceQuestions)
    await answerMultipleChoiceQuestions(multipleChoiceQuestions)
    await answerJudgingQuestions(judgingQuestions)
  } catch (e) {
    await browser.quit()
    throw 'examinationError'
  }

  // 答题完成关闭答题页
  await browser.quit()
}

async function answerChoiceQuestions(questions: WebElement[]): Promise<void> {
  for (let i: number = 0; i < questions.length; i++) {
    await answerChoiceQuestion(i, questions[i])
  }

  async function answerChoiceQuestion(index: number, question: WebElement): Promise<void> {
    const browser: WebDriver = await question.driver_

    // 获取答案列表
    const ttmItems: WebElement = await question.findElement(By.className('ttm_items'))
    const items: WebElement[] = await ttmItems.findElements(By.className('stem'))

    let i: number = 0

    do {
      // 浏览器滚动到答案
      await browser.executeScript('arguments[0].scrollIntoView(false);', question)

      // 获取本次选择的答案
      const stemItem: WebElement = await items[i].findElement(By.className('stemItem'))

      // 点击答案
      await stemItem.click()

      i++
    } while (await viewResults('单选题', index, browser))
  }
}

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
  [0, 1, 2, 3, 4]
]

async function answerMultipleChoiceQuestions(questions: WebElement[]): Promise<void> {
  for (let i: number = 0; i < questions.length; i++) {
    await MultipleChoiceQuestion(i, questions[i])
  }

  async function MultipleChoiceQuestion(index: number, question: WebElement) {
    const browser: WebDriver = await question.driver_

    // 获取答案列表
    const ttmItems: WebElement = await question.findElement(By.className('ttm_items'))
    const items: WebElement[] = await ttmItems.findElements(By.className('stem'))

    let i: number = 0

    do {
      // 浏览器滚动到答案
      await browser.executeScript('arguments[0].scrollIntoView(false);', question)

      if (i > 0) {
        // 取消已选中的答案
        await clickItems(i - 1, items)
      }

      // 点击答案
      await clickItems(i, items)

      i++
    } while (await viewResults('多选题', index, browser))
  }

  async function clickItems(index: number, items: WebElement[]): Promise<void> {
    // 获取需要点击的答案列表
    const result: number[] = MultipleChoiceResult[index]

    // 点击答案
    for (let i: number = 0; i < result.length; i++) {
      const stemItem: WebElement = await items[result[i]].findElement(By.className('stemItem'))
      await stemItem.click()
    }
  }
}

async function answerJudgingQuestions(questions: WebElement[]): Promise<void> {
  for (let i: number = 0; i < questions.length; i++) {
    await answerJudgingQuestion(i, questions[i])
  }

  async function answerJudgingQuestion(index: number, question: WebElement): Promise<void> {
    const browser: WebDriver = await question.driver_

    // 获取答案列表
    const ttmItems: WebElement = await question.findElement(By.className('ttm_items'))
    const items: WebElement[] = await ttmItems.findElements(By.className('stem'))

    let i: number = 0

    do {
      // 浏览器滚动到答案
      await browser.executeScript('arguments[0].scrollIntoView(false);', question)

      // 获取本次选择的答案
      const stemItem: WebElement = await items[i].findElement(By.className('stemItem'))

      // 点击答案
      await stemItem.click()

      i++
    } while (await viewResults('是非题', index, browser))
  }
}

async function viewResults(type: string, index: number, browser: WebDriver): Promise<boolean> {
  // 获取交卷按钮
  const sjmSubmit: WebElement = await browser.findElement(By.className('sjm_submit'))
  const submit: WebElement = await sjmSubmit.findElement(By.tagName('a'))

  // 浏览器滚动到交卷按钮
  await browser.executeScript('arguments[0].scrollIntoView();', submit)

  await submit.click()

  // 等待弹窗出现
  await browser.wait(async _ => {
    const dialogWrappers: WebElement[] = await browser.findElements(
      By.className('el-dialog__wrapper')
    )
    for (let i: number = 0; i < dialogWrappers.length; i++) {
      // 获取弹窗样式
      const style: string = await dialogWrappers[i].getAttribute('style')
      if (style.search('display: none') < 0) {
        const dialog: WebElement = await dialogWrappers[i].findElement(By.className('el-dialog'))
        const ariaLabel: string = await dialog.getAttribute('aria-label')
        if (ariaLabel === '答题成绩') {
          return true
        } else {
          const headerbtn: WebElement = await dialog.findElement(
            By.className('el-dialog__headerbtn')
          )
          await headerbtn.click()
        }
      }
    }
    return false
  })

  // 获取答案列表
  const sbdmTitles: WebElement[] = await browser.findElements(By.className('sbdm_title'))
  const sbdmMains: WebElement[] = await browser.findElements(By.className('sbdm_main'))

  for (let i: number = 0; i < sbdmTitles.length; i++) {
    // 获取答案 title
    const title: string = await sbdmTitles[i].getText()

    if (title.search(type) >= 0) {
      // 答案结果列表
      const lis: WebElement[] = await sbdmMains[i].findElements(By.tagName('li'))

      const use: WebElement = await lis[index].findElement(By.tagName('use'))
      const xlink: string = await use.getAttribute('xlink:href')

      if (xlink === '#icon-selected') {
        await closeResultsDiolag()
        return false
      }
    }
  }
  await closeResultsDiolag()
  return true

  async function closeResultsDiolag(): Promise<void> {
    const closeButton: WebElement = await browser.findElement(By.className('sbd_qding'))
    await closeButton.click()
  }
}
