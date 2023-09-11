import { divisionLint } from './utils'
import { initConfigFile } from './init'

// 项目启动
async function main(): Promise<void> {
  divisionLint.consoleDivisionLineByText('程序启动')
  const initStatus: boolean = await initConfigFile()
  if (!initStatus) {
    // 环境不满足时结束
    return
  }
}

main().finally(() => {
  divisionLint.consoleDivisionLineByText('程序结束')
})
