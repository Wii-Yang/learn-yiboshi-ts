import { WebDriver, WebElement, By, until } from 'selenium-webdriver'
import User from '../user'
import { consoleDivisionLineByText } from '../utils/DivisionLine'
import { updateUser } from '../user/DataBase'

export async function login(browser: WebDriver, user: User): Promise<void> {
  // 获取 new_login_box
  const newLoginBox: WebElement = await browser.wait(
    until.elementLocated(By.className('new_login_box'))
  )
  // 获取 nlb_main
  const nlbMainList: WebElement[] = await newLoginBox.findElements(By.className('nlb_main'))
  const nlbMain: WebElement = nlbMainList[0]
  // 获取 nlb_input
  const nlbInputList: WebElement[] = await nlbMain.findElements(By.className('nlb_input'))
  // 输入用户名
  await nlbInputList[0].findElement(By.tagName('input')).sendKeys(user.username)
  // 输入密码
  await nlbInputList[1].findElement(By.tagName('input')).sendKeys(user.password)

  // 获取 nlb_btn
  const nlbBtn: WebElement = await nlbMain.findElement(By.className('nlb_btn'))
  // 点击登录按钮
  await nlbBtn.click()

  // 等待滑动拼图验证出现
  await browser.wait(until.elementLocated(By.className('verifyMain')))
  // 等待手动完成验证
  consoleDivisionLineByText('等待手动完成验证')
  await browser.wait(async () => {
    const verifyMain = await browser.findElements(By.className('verifyMain'))
    return verifyMain.length === 0
  })

  try {
    // 获取 name
    const nameInput = await browser.wait(until.elementLocated(By.id('name')), 1000 * 10)
    user.name = await nameInput.getAttribute('value')

    // 获取 token
    user.token = await browser.executeScript('return localStorage.getItem("www_5HGGWrXN_token");')
    // 获取 fingerprintID
    user.fingerprintID = await browser.executeScript(
      'return localStorage.getItem("FingerprintID");'
    )
    // 更新用户信息
    updateUser(user)

    // 跳转到学习页
    await browser.get('http://www.yiboshi.com/usercenter/index')
  } catch (e) {
    // 登录失败重新选择用户学习
    await browser.quit()
    throw 'loginError'
  }
}
