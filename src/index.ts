import { divisionLint } from './utils'
import { initConfigFile } from './init'
import User from './user'
import { managementUser } from './user/Management'
import startLearn from './learn'
import { consoleDivisionLine, consoleDivisionLineByText } from './utils/DivisionLine'

// 项目启动
async function main(): Promise<void> {
  divisionLint.consoleDivisionLineByText('程序启动')
  const initStatus: boolean = await initConfigFile()
  if (!initStatus) {
    // 运行环境不满足时结束
    return
  }
  let learnEnd: boolean = false
  while (!learnEnd) {
    // 获取需要学习的用户
    const user: User = await managementUser()
    consoleDivisionLine()
    try {
      // 开始学习
      await startLearn(user)
      learnEnd = true
    } catch (e) {
      switch (e) {
        case 'loginError':
          consoleDivisionLineByText(`${user.username} 账号，密码错误！`)
          break
      }
      // 学习过程中报错重新选择用户学习
      consoleDivisionLineByText('学习过程中出错，重新开始学习！')
    }
  }
}

main().finally(() => {
  divisionLint.consoleDivisionLineByText('程序结束')
})
