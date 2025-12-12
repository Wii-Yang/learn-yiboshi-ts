import Menu from './index.ts';
import { readlineSync } from '../../utils.ts';
import User from '../index.ts';
import loginUser from '../../system/login.ts';
import { addUser } from '../management.ts';

class AddUserMenu extends Menu {
  constructor() {
    super('add', '添加用户');
  }

  public async fun(): Promise<void> {
    console.log('\n【添加用户】');

    // 输入账号密码
    const username = await readlineSync('请输入账号：');
    const password = await readlineSync('请输入密码：');

    const user = new User({ username, password });

    // 登录账号
    await loginUser(user);

    // 添加数据
    addUser(user);

    console.log('用户添加成功\n');
  }
}

export default AddUserMenu;
