import Menu from './index.ts';
import type User from '../index.ts';

class SelectMenu extends Menu {
  constructor() {
    super('select', '选择用户');
  }

  public async fun(): Promise<User> {
    console.log('\n【选择用户】');

    const user: User = await this.selectUser('请输入用户序号：');
    console.log(`选中【${user.getName()}】账号\n`);

    return user;
  }
}

export default SelectMenu;
