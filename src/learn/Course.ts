import { WebElement, By } from 'selenium-webdriver'
import User from '../user'
import { watchVideo } from './Video'
import { examination } from './Examination'
import { consoleDivisionLineByText } from '../utils/DivisionLine'

export async function learnCourse(course: WebElement, user: User): Promise<void> {
  const tdList: WebElement = await course.findElements(By.tagName('td'))

  // 课程名称
  const courseNameA: WebElement = await tdList[1].findElement(By.tagName('a'))
  const courseName: string = await courseNameA.getText()

  // 课程学习状态
  const courseLearnStatus: string = await tdList[3].getText()

  if (courseLearnStatus === '未学习' || courseLearnStatus === '学习中') {
    // 视频
    const k1: WebElement = await tdList[4].findElement(By.className('k1'))
    await watchVideo(k1, user)
    consoleDivisionLineByText(`《${courseName}》课程完成学习`)

    // 课程考试状态
    const td5A: WebElement = await tdList[5].findElement(By.className('k3'))
    const courseExamStatus: string = await td5A.getText()

    if (courseExamStatus !== '考试[最高100分]') {
      // 考试
      await examination(td5A, user)
      consoleDivisionLineByText(`《${courseName}》课程完成考试`)
    }
  }
}
