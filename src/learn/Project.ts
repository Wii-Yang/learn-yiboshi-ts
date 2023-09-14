import { WebDriver, WebElement, By, until } from 'selenium-webdriver'
import { consoleDivisionLineByText } from '../utils/DivisionLine'
import User from '../user'
import { createBrowser } from '../browser'

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
  if (projectStatus === '【未学习】') {
    await openProject(projectUrl, user)
  } else {
    consoleDivisionLineByText(`已完成《${projectText}》课程学习`)
  }
}

/**
 * 打开项目页
 * @param url
 * @param user
 */
async function openProject(url: string, user: User): Promise<void> {
  // 打开项目页
  const browser: WebDriver = await createBrowser()
  await browser.get('http://www.yiboshi.com/')
  await browser.executeScript(`localStorage.setItem('www_5HGGWrXN_token', '${user.token}');`)
  await browser.executeScript(`localStorage.setItem('FingerprintID', '${user.fingerprintID}');`)
  await browser.get(url)

  // 等待列表加载
  await browser.wait(until.elementLocated(By.className('nupmrm_content')))

  // 判断是否有弹窗
  const dialog: WebElement = await browser.findElement(By.className('el-dialog__wrapper dialog_'))
  const style: string = await dialog.getAttribute('style')
  if (style.search('display: none;') < 0) {
    // 当弹窗打开时关闭弹窗
    const dialogFooter: WebElement = await dialog.findElement(By.className('el-dialog__footer'))
    const closeButton: WebElement = await dialogFooter.findElement(
      By.className('el-button el-button--small el-button--default')
    )
    await closeButton.click()
  }

  // 获取课程名称
  const projectName: string = await browser.findElement(By.className('npdit1'))

  // 获取课程列表
  const courseList: WebElement[] = await browser.findElements(By.className('striped--near-white'))

  for (let i: number = 1; i < courseList.length; i++) {
    // 学习课程

    if (i === courseList.length - 1) {
      consoleDivisionLineByText(`完成《${projectName}》项目学习`)
    }
  }

  // 结束当前项目学习
  await browser.quit()
}
