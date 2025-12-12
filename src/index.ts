/// <reference types="node" />
import initSystem from './system/index.ts';
import { readlineSync } from './utils.ts';
import type User from './user/index.ts';
import getUserByMenus from './user/menus.ts';
import { isLogin } from './system/login.ts';
import loginUser from './system/login.ts';
import { editUser } from './user/management.ts';
import startLearn from './learn/index.ts';

// 主函数
async function main() {
  try {
    // 初始化系统
    await initSystem();

    // 获取用户
    const user: User = await getUserByMenus();

    // 判断用户是否登录
    console.log('验证账号中......');
    if (!(await isLogin(user))) {
      console.log(`【${user.getName()}】账号已失效，重新登录中......`);
      // 重新登录
      await loginUser(user);
      // 更新数据
      editUser(user);
    }

    // 开始学习
    await startLearn(user);
  } catch (e) {
    switch (e) {
      case 'exit':
        // 结束
        console.log('输入任意键结束......');
        await readlineSync();
        break;
      case 'login error':
        // 登录失败
        await main();
        break;
    }
  }
}

main();
