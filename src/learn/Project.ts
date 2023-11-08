import { WebDriver, WebElement, By } from 'selenium-webdriver'
import { consoleDivisionLineByText } from '../utils/DivisionLine'
import User from '../user'
import { createBrowserByUrl } from '../browser'
import { getCourseList, learnCourse } from './Course'

/**
 * 学习项目
 * @param project
 * @param user
 */
export async function learnProject(project: WebElement, user: User): Promise<void> {
  const npcbTxt: WebElement = await project.findElement(By.className('npcb_txt'))
  const npcbTxtA: WebElement = await npcbTxt.findElement(By.tagName('a'))

  // 获取项目名称
  const projectText: string = await npcbTxtA.getAttribute('title')
  // 获取项目地址
  const projectUrl: string = await npcbTxtA.getAttribute('href')

  // 获取项目状态
  const npcbStatus = await project.findElement(By.className('npcb_status'))
  const npcbStatusSpan = await npcbStatus.findElement(By.tagName('span'))
  const projectStatus = await npcbStatusSpan.getText()
  if (projectStatus === '【未学习】' || projectStatus === '【学习中】') {
    await openProject(projectUrl, user)
  } else {
    consoleDivisionLineByText(`已完成《${projectText}》项目学习`)
  }
}

/**
 * 打开项目页
 * @param url
 * @param user
 */
async function openProject(url: string, user: User): Promise<void> {
  // 打开项目页
  const browser: WebDriver = await createBrowserByUrl(url, user)

  // 获取课程列表
  const courseList: WebElement[] = await getCourseList(browser)

  // 获取项目名称
  const npdit1: WebElement = await browser.findElement(By.className('npdit1'))
  const projectName: string = await npdit1.getText()

  for (let i: number = 1; i < courseList.length; i++) {
    try {
      // 学习课程
      await learnCourse(courseList[i], user)
    } catch (e) {
      await browser.quit()
      throw e
    }
  }

  consoleDivisionLineByText(`完成《${projectName}》项目学习`)

  // 结束当前项目学习
  await browser.quit()
}
