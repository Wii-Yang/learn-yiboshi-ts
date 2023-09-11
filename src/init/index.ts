import { readFileSync, writeFileSync } from 'fs'
import * as process from 'process'
import cmd from 'child_process'

import { config } from '../utils'
import { readlineSync } from '../utils/ReadlineSync'

export async function initConfigFile(): Promise<boolean> {
  try {
    readFileSync(config.userDataBase)
  } catch (e) {
    console.log('初始化用户文件')
    writeFileSync(config.userDataBase, JSON.stringify([]), 'utf8' as BufferEncoding)
  }

  let isEnd = false
  try {
    readFileSync(config.chromedriverFileUrl)
  } catch (e) {
    console.log('请下载本电脑 chrome 浏览器版本对应的 chromedriver.exe 文件并放置到当前文件夹。')
    console.log(
      'chrome 浏览器版本查看方式请自行百度，推荐的 chromedriver.exe 的下载网址为 https://registry.npmmirror.com/binary.html?path=chromedriver'
    )
    process.stdout.write('是否直接打开网站：(Y/N)')
    const answer = await readlineSync()
    if (answer === 'Y' || answer === 'y') {
      cmd.exec('start chrome https://registry.npmmirror.com/binary.html?path=chromedriver')
    }
    process.stdout.write('输入任意键结束......')
    await readlineSync()
    isEnd = true
  }
  return !isEnd
}
