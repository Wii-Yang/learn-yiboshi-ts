import { WebDriver, WebElement, By, until } from 'selenium-webdriver'
import User from '../user'
import { createBrowser } from '../browser'
import { login } from './Login'
import { learnProject } from './Project'
import { consoleDivisionLineByText } from '../utils/DivisionLine'
import { getCourseList, learnCourse } from './Course'
import { waitAndCloseDialog } from '../utils'

/**
 * 开始学习
 * @param user
 */
export default async function startLearn(user: User): Promise<void> {
  const browser: WebDriver = await createBrowser()

  // 访问医博士网站
  await browser.get('https://www.yiboshi.com')

  // 获取 token 和 fingerprintID
  if (user.token) {
    await browser.executeScript(`localStorage.setItem('www_5HGGWrXN_token', '${user.token}');`)
  }
  if (user.fingerprintID) {
    await browser.executeScript(`localStorage.setItem('FingerprintID', '${user.fingerprintID}');`)
  }

  // 更新网页
  await browser.get('https://www.yiboshi.com/usercenter/index')
  const url: string = await browser.getCurrentUrl()
  if (url === 'https://www.yiboshi.com/') {
    // 未登录或登录失效时登录
    await login(browser, user)
  }

  // 等待弹窗出现
  await waitAndCloseDialog(browser)

  // 获取“我的课程”
  const curriculums: WebElement[] = await getMyCurriculums(browser)

  for (let i: number = 0; i < curriculums.length; i++) {
    const text = await curriculums[i].getText()
    // 切换到对应课程
    await curriculums[i].click()
    if (text.search('继续医学教育（远程）项目') >= 0) {
      // 切换到“我的项目”
      await changeToMyProjects(browser)

      // 获取项目列表
      const projects: WebElement[] = await getMyProjects(browser)

      for (let i: number = 0; i < projects.length; i++) {
        try {
          // 学习项目
          await learnProject(projects[i], user)
        } catch (e) {
          await browser.quit()
          throw e
        }
      }
      consoleDivisionLineByText('已完成所有项目学习')
    } else {
      // 获取项目列表
      const projects: WebElement[] = await browser.findElements(By.className('el-collapse-item'))
      for (let i = 0; i < projects.length; i++) {
        const header = await projects[i].findElement(By.className('el-collapse-item__header'))
        // 判断是否打开项目
        const classNames = await projects[i].getAttribute('class')
        if (classNames.search('is-active') < 0) {
          // 打开项目
          await header.click()
        }

        // 获取课程列表
        const courseList: WebElement[] = await getCourseList(browser, projects[i])
        for (let j: number = 1; j < courseList.length; j++) {
          try {
            // 学习课程
            await learnCourse(courseList[j], user, 1)
          } catch (e) {
            await browser.quit()
            throw e
          }
        }

        // 获取项目名称
        const projectName = await header.getText()

        consoleDivisionLineByText(`已完成《${projectName}》项目学习`)
      }
      consoleDivisionLineByText(`完成《${text}》课程学习`)
    }
  }

  await browser.quit()
}

/**
 * 获取“我的课程”项目列表
 */
async function getMyCurriculums(browser: WebDriver): Promise<WebElement[]> {
  // 获取 nupt_main
  const nuptMain = browser.findElement(By.className('nupt_main'))
  return nuptMain.findElements(By.tagName('a'))
}

/**
 * 切换到“我的项目“
 */
async function changeToMyProjects(browser: WebDriver): Promise<void> {
  // 等待列表加载
  await loading()

  const nupmrTitle: WebElement = await browser.wait(
    until.elementLocated(By.className('nupmr_title'))
  )
  const projectList: WebElement[] = await nupmrTitle.findElements(By.tagName('a'))
  let project: WebElement
  for (let i: number = 0; i < projectList.length; i++) {
    const text: string = await projectList[i].getText()
    if (text === '我的项目') {
      project = projectList[i]
      break
    }
  }
  await project.click()

  // 等待列表加载
  await loading()

  async function loading(): Promise<void> {
    await browser.wait(async _ => {
      const nupMain = await browser.findElements(By.className('nup_main'))
      return nupMain.length === 1
    })
    await browser.wait(async _ => {
      const nupMain: WebElement = await browser.findElement(By.className('nup_main'))
      const loadingMask: WebElement = await nupMain.findElement(By.className('el-loading-mask'))
      const display: string = await loadingMask.getCssValue('display')
      return display === 'none'
    })
  }
}

/**
 * 获取“我的项目”项目列表
 */
async function getMyProjects(browser: WebDriver): Promise<WebElement[]> {
  // 获取 nup_main
  const nupMain = await browser.findElement(By.className('nup_main'))
  // 获取 nupmrm_content
  const nupmrmContent = await nupMain.findElement(By.className('nupmrm_content'))
  // 获取 npc_box 列表
  return await nupmrmContent.findElements(By.className('npc_box'))
}
