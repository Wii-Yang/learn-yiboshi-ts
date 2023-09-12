import { divisionLint } from './utils'
import { initConfigFile } from './init'
import User from './user'
import { managementUser } from './user/Management'

// 项目启动
async function main(): Promise<void> {
  divisionLint.consoleDivisionLineByText('程序启动')
  const initStatus: boolean = await initConfigFile()
  if (!initStatus) {
    // 运行环境不满足时结束
    return
  }
  const user: User = await managementUser()
  console.log(user)
}

main().finally(() => {
  divisionLint.consoleDivisionLineByText('程序结束')
})
