import Menu from './index.ts';
import User from '../index.ts';
import { readlineSync } from '../../utils.ts';
import loginUser from '../../system/login.ts';
import { editUser } from '../management.ts';

class EditMenu extends Menu {
  constructor() {
    super('edit', '编辑用户');
  }

  public async fun() {
    console.log('\n【编辑用户】');

    const user: User = await this.selectUser('请选择要编辑的用户：');

    console.log(`选中【${user.getName()}】账号：【${user.getUsername()}】密码：【${user.getPassword()}】`);

    const username: string = await readlineSync('请输入新的账号(不修改直接回车)：');
    if (username.trim()) {
      user.setUsername(username.trim());
    }

    const password: string = await readlineSync('请输入新的密码(不修改直接回车)：');
    if (password.trim()) {
      user.setPassword(password.trim());
    }

    const newUser = new User({ id: user.getId(), username: user.getUsername(), password: user.getPassword() });

    // 登录账号
    await loginUser(newUser);

    // 更新数据
    editUser(newUser);

    console.log('用户编辑成功\n');
  }
}

export default EditMenu;
