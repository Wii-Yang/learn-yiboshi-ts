import { WebDriver, WebElement, By } from 'selenium-webdriver'
import User from '../user'
import { watchVideo } from './Video'
import { examination } from './Examination'
import { consoleDivisionLineByText } from '../utils/DivisionLine'
import { waitAndCloseDialog } from '../utils'

export async function learnCourse(
  course: WebElement,
  user: User,
  index: number = 0
): Promise<void> {
  const tdList: WebElement = await course.findElements(By.tagName('td'))

  // 课程名称
  const courseNameA: WebElement = await tdList[1].findElement(By.tagName('a'))
  const courseName: string = await courseNameA.getText()

  // 课程学习状态
  const courseLearnStatus: string = await tdList[3 + index].getText()

  if (courseLearnStatus === '未学习' || courseLearnStatus === '学习中') {
    // 视频
    const k1: WebElement = await tdList[4 + index].findElement(By.className('k1'))
    await watchVideo(k1, user)
    consoleDivisionLineByText(`《${courseName}》课程完成学习`)

    // 课程考试状态
    const td5A: WebElement = await tdList[5 + index].findElement(By.className('k3'))
    const courseExamStatus: string = await td5A.getText()

    if (courseExamStatus !== '考试[最高100分]') {
      // 考试
      await examination(td5A, user)
      consoleDivisionLineByText(`《${courseName}》课程完成考试`)
    }
  }
}

export async function getCourseList(
  browser: WebDriver,
  parent?: WebElement
): Promise<WebElement[]> {
  const parentElement: WebDriver | WebElement = parent || browser
  // 等待列表加载
  await browser.wait(async _ => {
    const courseList: WebElement[] = await parentElement.findElements(
      By.className('striped--near-white')
    )
    return courseList.length > 1
  })

  // 等待弹窗出现
  await waitAndCloseDialog(browser)

  return await parentElement.findElements(By.className('striped--near-white'))
}
