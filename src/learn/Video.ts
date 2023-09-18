import { WebDriver, WebElement, By, until } from 'selenium-webdriver'
import User from '../user'
import { createBrowserByUrl } from '../browser'

/**
 * 学习视频
 * @param videoButton
 * @param user
 */
export async function watchVideo(videoButton: WebElement, user: User): Promise<void> {
  await videoButton.click()

  // 浏览器切换到视频页
  const browser: WebDriver = videoButton.driver_
  const courseWindowHandle: string = await browser.getWindowHandle()
  const allWindowHandles: string[] = await browser.getAllWindowHandles()
  const videoWindowHandle: string | undefined = allWindowHandles.find(
    (item: string): boolean => item !== courseWindowHandle
  )
  await browser.switchTo().window(videoWindowHandle)

  await loading(browser, videoWindowHandle)

  // 获取视频页 url
  const videoUrl = await browser.getCurrentUrl()

  // 浏览器关闭视频页
  await browser.close()
  // 浏览器切换到课程页
  await browser.switchTo().window(courseWindowHandle)

  await openVideo(videoUrl, user)
}

/**
 * 等待视频加载完成
 */
async function loading(browser: WebDriver, windowHandle?: string): Promise<void> {
  await browser.wait(until.elementLocated(By.className('vml_main')))

  await browser.wait(async _ => {
    if (windowHandle) {
      const currentWindowHandle = await browser.getWindowHandle()
      if (currentWindowHandle === windowHandle) return true
    }
    const vmlMain: WebElement = await browser.findElement(By.className('vml_main'))
    const vmlmIngList: WebElement[] = await vmlMain.findElements(By.tagName('li'))
    return vmlmIngList.length > 0
  })

  await browser.sleep(1000 * 2)

  await continueLearningVideo(browser)
}

/**
 * 打开视频页
 * @param url
 * @param user
 */
async function openVideo(url: string, user: User): Promise<void> {
  // 打开视频页
  const browser: WebDriver = await createBrowserByUrl(url, user)

  // 等待视频加载完成
  await loading(browser)

  // 判断是否需要观看视频
  if (!(await completeViewing(browser))) {
    // 判断是否有弹窗

    // 播放视频
    const plyrControl: WebElement = await browser.findElement(
      By.className('plyr__control plyr__control--overlaid')
    )
    await plyrControl.click()

    // 等待视频播放结束
    await browser.wait(
      async _ => {
        await continueLearningVideo(browser)
        return await completeViewing(browser)
      },
      0,
      undefined,
      1000
    )
  }
  await browser.quit()
}

/**
 * 判断是否完成视频学习
 * @param browser
 */
async function completeViewing(browser: WebDriver): Promise<boolean> {
  const videoDabiao: WebElement = await browser.findElement(By.className('video_dabiao'))
  const videoDabiaoText: string = await videoDabiao.getText()
  const value: string[] | null = videoDabiaoText.match(/[0-9]{1,2}/g) as string[] | null
  if (value && value.length === 2) {
    value.toString()
    if (Number(value[0]) <= Number(value[1])) {
      return true
    }
  }
  return false
}

/**
 * 处理“继续学习”消息弹窗
 * @param browser
 */
async function continueLearningVideo(browser: WebDriver): Promise<void> {
  const messageBoxes: WebElement = await browser.findElements(
    By.className('el-message-box__wrapper')
  )
  for (let i: number = 0; i < messageBoxes.length; i++) {
    const ariaLabel: string = await messageBoxes[i].getAttribute('aria-label')
    if (ariaLabel === '温馨提示' || ariaLabel === '提示') {
      const style: string = await messageBoxes[i].getAttribute('style')
      if (style.search('display: none') < 0) {
        const messageBoxBtns: WebElement = await messageBoxes[i].findElement(
          By.className('el-message-box__btns')
        )
        const button: WebElement = await messageBoxBtns.findElement(By.tagName('button'))
        await button.click()
      }
    }
  }
}
