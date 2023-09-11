import * as path from 'path'

// chromedriver 文件地址
const chromedriverFileUrl: string = path.join(process.cwd(), 'chromedriver.exe')

// 用户信息文件地址
const userDataBase: string = path.join(process.cwd(), 'user.json')

export { chromedriverFileUrl, userDataBase }
