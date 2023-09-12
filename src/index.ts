import { divisionLint } from './utils'
import { initConfigFile } from './init'
import User from './user'
import { managementUser } from './user/Management'
import startLearn from './learn'
import { consoleDivisionLineByText } from './utils/DivisionLine'

// 项目启动
async function main(): Promise<void> {
  divisionLint.consoleDivisionLineByText('程序启动')
  const initStatus: boolean = await initConfigFile()
  if (!initStatus) {
    // 运行环境不满足时结束
    return
  }
  // 获取需要学习的用户
  const user: User = await managementUser()
  try {
    // 开始学习
    await startLearn(user)
  } catch (e) {
    switch (e) {
      case 'loginError':
        consoleDivisionLineByText(`${user.username} 账号，密码错误！`)
        break
    }
  }
}

main().finally(() => {
  divisionLint.consoleDivisionLineByText('程序结束')
})
