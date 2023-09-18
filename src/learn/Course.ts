import { WebElement, By } from 'selenium-webdriver'
import User from '../user'
import { watchVideo } from './Video'

export async function learnCourse(course: WebElement, user: User): Promise<void> {
  const tdList: WebElement = await course.findElements(By.tagName('td'))

  // 课程学习状态
  const courseLearnStatus: string = await tdList[3].getText()
  if (courseLearnStatus === '未学习' || courseLearnStatus === '学习中') {
    // 观看视频
    const k1: WebElement = await tdList[4].findElement(By.className('k1'))
    await watchVideo(k1, user)
  }

  // 课程考试状态
  const td5A: WebElement = await tdList[5].findElement(By.className('k3'))
  const courseExamStatus: string = await td5A.getText()
  if (courseExamStatus !== '考试[最高100分]') {
    // 考试
  }

  // 等待视频观看结束与完成考试后结束
}
